# Reconnection Patterns

Advanced patterns for handling reconnection in `WebViewStream`.

## Automatic Reconnection

### Basic Reconnection Loop

Automatically reconnect when the stream ends or errors:

```typescript
async function autoReconnectStream(url: string) {
  while (true) {
    const controller = new AbortController();
    
    try {
      const stream = new WebViewStream(url, controller.signal);
      
      for await (const event of stream) {
        console.log('Event:', event);
      }
      
      // Stream ended normally, reconnect
      console.log('Stream ended, reconnecting...');
      
    } catch (error) {
      console.error('Stream error:', error);
      console.log('Reconnecting after error...');
      
    } finally {
      controller.abort();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### With Exponential Backoff

Implement exponential backoff between reconnection attempts:

```typescript
async function reconnectWithBackoff(url: string, maxDelay = 30000) {
  let reconnectAttempt = 0;
  
  while (true) {
    const controller = new AbortController();
    
    try {
      const stream = new WebViewStream(url, controller.signal);
      
      for await (const event of stream) {
        reconnectAttempt = 0; // Reset on successful event
        console.log('Event:', event);
      }
      
    } catch (error) {
      console.error('Stream error:', error);
      reconnectAttempt++;
      
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), maxDelay);
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } finally {
      controller.abort();
    }
  }
}
```

## Connection State Management

### Track Connection State

Maintain connection state for UI updates:

```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

class ManagedStream {
  private state: ConnectionState = 'disconnected';
  private controller: AbortController | null = null;
  private onStateChange?: (state: ConnectionState) => void;
  
  constructor(
    private url: string,
    onStateChange?: (state: ConnectionState) => void
  ) {
    this.onStateChange = onStateChange;
  }
  
  private setState(state: ConnectionState) {
    this.state = state;
    this.onStateChange?.(state);
  }
  
  async start() {
    this.setState('connecting');
    this.controller = new AbortController();
    
    try {
      const stream = new WebViewStream(this.url, this.controller.signal);
      this.setState('connected');
      
      for await (const event of stream) {
        console.log('Event:', event);
      }
      
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }
  
  stop() {
    this.controller?.abort();
    this.setState('disconnected');
  }
  
  getState(): ConnectionState {
    return this.state;
  }
}

// Usage
const managedStream = new ManagedStream(
  'https://api.example.com/events',
  (state) => console.log('State changed:', state)
);

managedStream.start();
```

## Circuit Breaker Pattern

### Implement Circuit Breaker

Prevent repeated connection attempts when server is down:

```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private nextAttempt = 0;
  
  constructor(
    private failureThreshold = 5,
    private timeout = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

async function streamWithCircuitBreaker(url: string) {
  while (true) {
    try {
      await breaker.execute(async () => {
        const controller = new AbortController();
        const stream = new WebViewStream(url, controller.signal);
        
        for await (const event of stream) {
          console.log('Event:', event);
        }
      });
    } catch (error) {
      if (error.message === 'Circuit breaker is open') {
        console.log('Circuit breaker open, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}
```

## See Also

- [Error Handling](error-handling.md) - Error handling patterns
- [API Reference](../api/webviewstream.md) - Complete API documentation
