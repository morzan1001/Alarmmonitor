import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Dashboard from './Dashboard';
import { MockWebSocket } from '../test/mocks/websocket';

describe('Dashboard', () => {
  let mockWebSocketInstances: MockWebSocket[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    mockWebSocketInstances = [];
    
    // Setup WebSocket mock with instance tracking
    (globalThis as any).WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        mockWebSocketInstances.push(this);
      }
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    mockWebSocketInstances = [];
  });

  it('renders the dashboard with default values', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Alarmstichwort')).toBeInTheDocument();
    expect(screen.getByText('Alarmeingang')).toBeInTheDocument();
    expect(screen.getByText('Uhrzeit')).toBeInTheDocument();
    expect(screen.getByText('Alarmierte Fahrzeuge')).toBeInTheDocument();
    expect(screen.getByText('Fahrzeug 1')).toBeInTheDocument();
    expect(screen.getByText('Fahrzeug 2')).toBeInTheDocument();
  });

  it('shows connection error after 1 second if no connection', async () => {
    // Override the MockWebSocket to not auto-connect
    (globalThis as any).WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url, false); // Pass false to prevent auto-connect
        mockWebSocketInstances.push(this);
      }
    };

    render(<Dashboard />);
    
    // Initially no error message (isInitialLoad is true)
    expect(screen.queryByText(/Keine Verbindung zum Server/)).not.toBeInTheDocument();
    
    // Advance timers to trigger the 1 second timeout
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    
    // Now the error message should appear
    expect(screen.getByText('Keine Verbindung zum Server - Verbindungsversuch läuft...')).toBeInTheDocument();
  });
  
  it('updates the time every second', async () => {
    const mockDate = new Date('2024-01-01T12:00:00');
    vi.setSystemTime(mockDate);
    
    render(<Dashboard />);
    
    // Wait for WebSocket connection
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    // Find the time element by its parent structure
    const timeContainer = screen.getByText('Uhrzeit').closest('div');
    const timeElement = timeContainer?.querySelector('p');
    
    // Initial time should be empty or show current time
    expect(timeElement).toBeInTheDocument();
    
    // Advance time by 1 second
    vi.setSystemTime(new Date('2024-01-01T12:00:01'));
    
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    
    // Time should update
    expect(timeElement?.textContent).toBe('12:00:01');
  });

  it('processes incoming WebSocket messages', async () => {
    render(<Dashboard />);
    
    // Wait for WebSocket to be created
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    // Get the WebSocket instance
    const wsInstance = mockWebSocketInstances[0];
    expect(wsInstance).toBeDefined();
    
    // Simulate incoming message
    const testData = {
      ziel: {
        coordinates: {
          lat: 52.5200,
          lng: 13.4050
        }
      },
      keyword: 'Brand in Gebäude',
      description: 'Rauchentwicklung im Dachgeschoss',
      vehicles: ['HLF 20', 'DLK 23', 'ELW 1'],
      sondersignal: 'Ja'
    };
    
    await act(async () => {
      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(testData)
        }));
      }
    });
    
    // Check if the data is displayed
    expect(screen.getByText('Brand in Gebäude')).toBeInTheDocument();
    expect(screen.getByText('Rauchentwicklung im Dachgeschoss')).toBeInTheDocument();
    expect(screen.getByText('HLF 20')).toBeInTheDocument();
    expect(screen.getByText('DLK 23')).toBeInTheDocument();
    expect(screen.getByText('ELW 1')).toBeInTheDocument();
    expect(screen.getByAltText('SonderSignal Ja')).toBeInTheDocument();
  });

  it('shows SonderSignal "Nein" image if sondersignal is Nein', async () => {
    render(<Dashboard />);
    
    // Wait for WebSocket to be created
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    const wsInstance = mockWebSocketInstances[0];
    expect(wsInstance).toBeDefined();
    
    const testData = {
      ziel: { coordinates: { lat: 50.7618649, lng: 7.0495328 } },
      keyword: 'Technische Hilfeleistung',
      description: '',
      vehicles: ['RW 1'],
      sondersignal: 'Nein'
    };
    
    await act(async () => {
      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: JSON.stringify(testData)
        }));
      }
    });
    
    expect(screen.getByAltText('SonderSignal Nein')).toBeInTheDocument();
  });

  it('tries to reconnect after connection is lost', async () => {
    const mockSetTimeout = vi.spyOn(globalThis, 'setTimeout');
    
    render(<Dashboard />);
    
    // Wait for WebSocket to be created
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    const wsInstance = mockWebSocketInstances[0];
    expect(wsInstance).toBeDefined();
    
    // Simulate connection close
    await act(async () => {
      if (wsInstance.onclose) {
        wsInstance.onclose(new CloseEvent('close'));
      }
    });
    
    // Check for reconnect attempt
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
  });

  it('handles invalid WebSocket messages', async () => {
    render(<Dashboard />);
    
    // Wait for WebSocket to be created
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    const wsInstance = mockWebSocketInstances[0];
    expect(wsInstance).toBeDefined();
    
    // Try to send invalid JSON - this should not crash
    await act(async () => {
      if (wsInstance.onmessage) {
        wsInstance.onmessage(new MessageEvent('message', {
          data: 'invalid json'
        }));
      }
    });
    
    // Dashboard should still be rendered
    expect(screen.getByText('Alarmstichwort')).toBeInTheDocument();
  });

  it('shows coordinates in popup', () => {
    render(<Dashboard />);
    
    // The coordinates are shown in the popup
    expect(screen.getByText(/Coordinates:/)).toBeInTheDocument();
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });
});