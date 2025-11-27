import type { RealtimeUpdate } from '@/types';

type EventCallback = (data: any) => void;

class RealtimeService {
  private eventSource: EventSource | null = null;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, EventCallback[]> = new Map();
  private useSSE = true; // Prefer SSE over WebSocket

  connect(useSSE = true): void {
    this.useSSE = useSSE;
    
    if (useSSE) {
      this.connectSSE();
    } else {
      this.connectWebSocket();
    }
  }

  private connectSSE(): void {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('No auth token found for SSE connection');
      return;
    }

    try {
      this.eventSource = new EventSource(`${API_URL}/realtime?token=${token}`);

      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.eventSource?.close();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      this.attemptReconnect();
    }
  }

  private connectWebSocket(): void {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.warn('No auth token found for WebSocket connection');
      return;
    }

    try {
      this.ws = new WebSocket(`${WS_URL}/realtime?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private handleMessage(data: RealtimeUpdate): void {
    const { type } = data;
    const callbacks = this.listeners.get(type);
    
    if (callbacks) {
      callbacks.forEach((callback) => callback(data.data));
    }

    // Emit to 'all' listeners
    const allCallbacks = this.listeners.get('all');
    if (allCallbacks) {
      allCallbacks.forEach((callback) => callback(data));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(this.useSSE);
    }, delay);
  }

  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  off(eventType: string, callback?: EventCallback): void {
    if (!callback) {
      this.listeners.delete(eventType);
      return;
    }

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    if (this.useSSE) {
      return this.eventSource?.readyState === EventSource.OPEN;
    } else {
      return this.ws?.readyState === WebSocket.OPEN;
    }
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
