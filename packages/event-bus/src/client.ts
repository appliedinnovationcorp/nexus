import { Kafka, KafkaConfig, Producer, Consumer, Admin } from 'kafkajs';
import { EventProducer } from './producer';
import { EventConsumer } from './consumer';
import { EventBusConfig, Event, EventHandler } from './types';
import { logger } from './utils/logger';
import { metrics } from './utils/metrics';

export class EventBus {
  private kafka: Kafka;
  private producer: EventProducer;
  private consumer: EventConsumer;
  private admin: Admin;
  private isConnected: boolean = false;

  constructor(private config: EventBusConfig) {
    const kafkaConfig: KafkaConfig = {
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      sasl: config.sasl,
      connectionTimeout: config.connectionTimeout || 3000,
      requestTimeout: config.requestTimeout || 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    };

    this.kafka = new Kafka(kafkaConfig);
    this.producer = new EventProducer(this.kafka.producer(config.producer));
    this.consumer = new EventConsumer(this.kafka.consumer(config.consumer));
    this.admin = this.kafka.admin();
  }

  async connect(): Promise<void> {
    try {
      logger.info('Connecting to Kafka...');
      
      await this.admin.connect();
      await this.producer.connect();
      await this.consumer.connect();
      
      this.isConnected = true;
      metrics.incrementCounter('event_bus_connections_total', { status: 'success' });
      
      logger.info('Successfully connected to Kafka');
    } catch (error) {
      metrics.incrementCounter('event_bus_connections_total', { status: 'error' });
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from Kafka...');
      
      await this.consumer.disconnect();
      await this.producer.disconnect();
      await this.admin.disconnect();
      
      this.isConnected = false;
      logger.info('Successfully disconnected from Kafka');
    } catch (error) {
      logger.error('Failed to disconnect from Kafka:', error);
      throw error;
    }
  }

  async publish<T = any>(event: Event<T>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    try {
      await this.producer.send(event);
      metrics.incrementCounter('events_published_total', { 
        topic: event.topic,
        type: event.type 
      });
    } catch (error) {
      metrics.incrementCounter('events_publish_errors_total', { 
        topic: event.topic,
        type: event.type 
      });
      throw error;
    }
  }

  async subscribe<T = any>(
    topics: string | string[],
    handler: EventHandler<T>,
    options?: { fromBeginning?: boolean }
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    const topicArray = Array.isArray(topics) ? topics : [topics];
    
    try {
      await this.consumer.subscribe(topicArray, handler, options);
      
      for (const topic of topicArray) {
        metrics.incrementCounter('event_subscriptions_total', { topic });
      }
    } catch (error) {
      for (const topic of topicArray) {
        metrics.incrementCounter('event_subscription_errors_total', { topic });
      }
      throw error;
    }
  }

  async createTopics(topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number }>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    try {
      const topicConfigs = topics.map(({ topic, numPartitions = 1, replicationFactor = 1 }) => ({
        topic,
        numPartitions,
        replicationFactor
      }));

      await this.admin.createTopics({
        topics: topicConfigs,
        waitForLeaders: true
      });

      logger.info(`Created topics: ${topics.map(t => t.topic).join(', ')}`);
    } catch (error) {
      logger.error('Failed to create topics:', error);
      throw error;
    }
  }

  async deleteTopics(topics: string[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    try {
      await this.admin.deleteTopics({
        topics
      });

      logger.info(`Deleted topics: ${topics.join(', ')}`);
    } catch (error) {
      logger.error('Failed to delete topics:', error);
      throw error;
    }
  }

  async listTopics(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    try {
      return await this.admin.listTopics();
    } catch (error) {
      logger.error('Failed to list topics:', error);
      throw error;
    }
  }

  async getTopicMetadata(topics?: string[]) {
    if (!this.isConnected) {
      throw new Error('EventBus is not connected');
    }

    try {
      return await this.admin.fetchTopicMetadata({ topics });
    } catch (error) {
      logger.error('Failed to get topic metadata:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    await this.consumer.pause();
  }

  async resume(): Promise<void> {
    await this.consumer.resume();
  }

  async seek(topic: string, partition: number, offset: string): Promise<void> {
    await this.consumer.seek(topic, partition, offset);
  }

  getMetrics() {
    return {
      isConnected: this.isConnected,
      producer: this.producer.getMetrics(),
      consumer: this.consumer.getMetrics()
    };
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', details: { error: 'Not connected' } };
      }

      // Test connection by listing topics
      await this.admin.listTopics();
      
      return {
        status: 'healthy',
        details: {
          connected: true,
          producer: await this.producer.healthCheck(),
          consumer: await this.consumer.healthCheck()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}
