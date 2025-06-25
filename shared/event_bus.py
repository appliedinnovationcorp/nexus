"""
Event Bus implementation using Kafka for AIC Synergy platform
"""
import json
import logging
from typing import Any, Callable, Dict, List, Optional
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import asyncio
from concurrent.futures import ThreadPoolExecutor
from .events import BaseEvent

logger = logging.getLogger(__name__)


class EventBus:
    """Event Bus for publishing and subscribing to domain events"""
    
    def __init__(self, kafka_servers: List[str] = None):
        self.kafka_servers = kafka_servers or ['localhost:9092']
        self.producer = None
        self.consumers: Dict[str, KafkaConsumer] = {}
        self.handlers: Dict[str, List[Callable]] = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        
    def _get_producer(self) -> KafkaProducer:
        """Get or create Kafka producer"""
        if not self.producer:
            self.producer = KafkaProducer(
                bootstrap_servers=self.kafka_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',
                retries=3,
                retry_backoff_ms=1000
            )
        return self.producer
    
    async def publish(self, event: BaseEvent, topic: str = None) -> bool:
        """Publish an event to Kafka"""
        try:
            topic = topic or f"aic.{event.aggregate_type.lower()}.events"
            producer = self._get_producer()
            
            event_data = event.dict()
            
            # Send to Kafka
            future = producer.send(
                topic,
                key=event.aggregate_id,
                value=event_data,
                headers=[
                    ('event_type', event.event_type.encode('utf-8')),
                    ('aggregate_type', event.aggregate_type.encode('utf-8')),
                    ('correlation_id', (event.correlation_id or '').encode('utf-8'))
                ]
            )
            
            # Wait for acknowledgment
            record_metadata = future.get(timeout=10)
            
            logger.info(
                f"Event published: {event.event_type} to topic {topic} "
                f"(partition: {record_metadata.partition}, offset: {record_metadata.offset})"
            )
            
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to publish event {event.event_type}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error publishing event: {e}")
            return False
    
    def subscribe(self, topic: str, handler: Callable[[Dict[str, Any]], None]):
        """Subscribe to events on a topic"""
        if topic not in self.handlers:
            self.handlers[topic] = []
        self.handlers[topic].append(handler)
        
        # Start consumer if not already running
        if topic not in self.consumers:
            self._start_consumer(topic)
    
    def _start_consumer(self, topic: str):
        """Start a Kafka consumer for a topic"""
        def consume():
            consumer = KafkaConsumer(
                topic,
                bootstrap_servers=self.kafka_servers,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                key_deserializer=lambda k: k.decode('utf-8') if k else None,
                group_id=f"aic-synergy-{topic}",
                auto_offset_reset='latest',
                enable_auto_commit=True
            )
            
            self.consumers[topic] = consumer
            
            logger.info(f"Started consumer for topic: {topic}")
            
            for message in consumer:
                try:
                    event_data = message.value
                    
                    # Process with all registered handlers
                    for handler in self.handlers.get(topic, []):
                        try:
                            handler(event_data)
                        except Exception as e:
                            logger.error(f"Handler error for topic {topic}: {e}")
                            
                except Exception as e:
                    logger.error(f"Error processing message from {topic}: {e}")
        
        # Run consumer in thread pool
        self.executor.submit(consume)
    
    def close(self):
        """Close all connections"""
        if self.producer:
            self.producer.close()
        
        for consumer in self.consumers.values():
            consumer.close()
        
        self.executor.shutdown(wait=True)


# Global event bus instance
event_bus = EventBus()


# Convenience functions
async def publish_event(event: BaseEvent, topic: str = None) -> bool:
    """Publish an event using the global event bus"""
    return await event_bus.publish(event, topic)


def subscribe_to_events(topic: str, handler: Callable[[Dict[str, Any]], None]):
    """Subscribe to events using the global event bus"""
    event_bus.subscribe(topic, handler)


# Event handler decorators
def event_handler(topic: str):
    """Decorator for event handlers"""
    def decorator(func: Callable[[Dict[str, Any]], None]):
        subscribe_to_events(topic, func)
        return func
    return decorator


def domain_event_handler(aggregate_type: str):
    """Decorator for domain event handlers"""
    topic = f"aic.{aggregate_type.lower()}.events"
    return event_handler(topic)
