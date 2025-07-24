import { vi } from 'vitest';

export class MockWebSocket {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  autoConnect: boolean = true;

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor(url: string, autoConnect: boolean = true) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.autoConnect = autoConnect;
    
    if (autoConnect) {
      // Use vi.fn() to create a mock timer that works with fake timers
      const timer = vi.fn(() => {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) {
          this.onopen(new Event('open'));
        }
      });
      
      // Schedule the connection
      if (typeof setTimeout !== 'undefined') {
        setTimeout(timer, 0);
      } else {
        // If setTimeout is not available, call immediately
        timer();
      }
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    console.log('WebSocket send:', data);
  }
}

export const setupWebSocketMock = () => {
  (globalThis as any).WebSocket = MockWebSocket;
};

export const createMockWebSocketInstance = (url: string = 'wss://test.com') => {
  return new MockWebSocket(url);
};