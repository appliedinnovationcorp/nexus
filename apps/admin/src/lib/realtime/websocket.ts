'use client';

import { useState, useEffect } from 'react';

export interface RealtimeMessage {
  channel: string;
  event: string;
  payload: any;
  timestamp: number;
}

export interface ChannelSubscription {
  channel: string;
  callback: (payload: any) => void;
  filter?: (payload: any) => boolean;
}

export interface RealtimeConfig {
  url: string;
  apiKey?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export class RealtimeManager {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private subscriptions: Map<string, ChannelSubscription[]> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: RealtimeConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setConnectionState('connecting');

      try {
        const url = new URL(this.config.url);
        if (this.config.apiKey) {
          url.searchParams.set('apikey', this.config.apiKey);
        }

        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          console.log('🔗 WebSocket connected');
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.setConnectionState('disconnected');
          this.stopHeartbeat();
          
          if (!event.wasClean && this.shouldReconnect()) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.setConnectionState('error');
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.setConnectionState('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopReconnect();
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionState('disconnected');
  }

  subscribe(channel: string, callback: (payload: any) => void, filter?: (payload: any) => boolean): () => void {
    const subscription: ChannelSubscription = { channel, callback, filter };
    
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    
    this.subscriptions.get(channel)!.push(subscription);

    // Send subscription message to server
    this.sendMessage({
      type: 'subscribe',
      channel,
      timestamp: Date.now(),
    });

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(channel);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
          
          // If no more subscriptions for this channel, unsubscribe
          if (subs.length === 0) {
            this.subscriptions.delete(channel);
            this.sendMessage({
              type: 'unsubscribe',
              channel,
              timestamp: Date.now(),
            });
          }
        }
      }
    };
  }

  broadcast(channel: string, event: string, payload: any): void {
    this.sendMessage({
      type: 'broadcast',
      channel,
      event,
      payload,
      timestamp: Date.now(),
    });
  }

  presence(channel: string, key: string, payload: any): void {
    this.sendMessage({
      type: 'presence',
      channel,
      key,
      payload,
      timestamp: Date.now(),
    });
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private handleMessage(message: RealtimeMessage): void {
    const { channel, event, payload } = message;

    // Handle system messages
    if (channel === 'system') {
      this.handleSystemMessage(event, payload);
      return;
    }

    // Handle channel subscriptions
    const subscriptions = this.subscriptions.get(channel);
    if (subscriptions) {
      subscriptions.forEach(sub => {
        if (!sub.filter || sub.filter(payload)) {
          try {
            sub.callback(payload);
          } catch (error) {
            console.error(`❌ Error in subscription callback for channel ${channel}:`, error);
          }
        }
      });
    }

    // Emit event to listeners
    this.emit('message', message);
  }

  private handleSystemMessage(event: string, payload: any): void {
    switch (event) {
      case 'pong':
        // Heartbeat response
        break;
      case 'error':
        console.error('❌ Server error:', payload);
        this.emit('error', payload);
        break;
      case 'rate_limit':
        console.warn('⚠️ Rate limit exceeded:', payload);
        this.emit('rate_limit', payload);
        break;
      default:
        console.log('📨 System message:', event, payload);
    }
  }

  private sendMessage(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection_state_change', state);
    }
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < (this.config.maxReconnectAttempts || 10);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('❌ Reconnection failed:', error);
        if (this.shouldReconnect()) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'ping',
          timestamp: Date.now(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// React hook for using realtime
export function useRealtime(config: RealtimeConfig) {
  const [manager] = useState(() => new RealtimeManager(config));
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    const unsubscribe = manager.on('connection_state_change', setConnectionState);
    
    manager.connect().catch(error => {
      console.error('❌ Failed to connect to realtime:', error);
    });

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, [manager]);

  return {
    manager,
    connectionState,
    isConnected: connectionState === 'connected',
  };
}

// Factory function
export function createRealtimeManager(config: RealtimeConfig): RealtimeManager {
  return new RealtimeManager(config);
}

// Default configuration
export const getDefaultRealtimeConfig = (): RealtimeConfig => ({
  url: process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:3001/realtime',
  apiKey: process.env.NEXT_PUBLIC_REALTIME_API_KEY,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
});
