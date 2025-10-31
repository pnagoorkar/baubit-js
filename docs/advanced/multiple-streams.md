# Multiple Streams

Patterns for managing multiple `WebViewStream` instances.

## Parallel Streams

Process multiple streams concurrently:

```typescript
async function processMultipleStreams() {
  const controller1 = new AbortController();
  const controller2 = new AbortController();
  
  const stream1 = new WebViewStream('https://api.example.com/events1', controller1.signal);
  const stream2 = new WebViewStream('https://api.example.com/events2', controller2.signal);
  
  try {
    await Promise.all([
      (async () => {
        for await (const event of stream1) {
          console.log('Stream 1:', event);
        }
      })(),
      (async () => {
        for await (const event of stream2) {
          console.log('Stream 2:', event);
        }
      })()
    ]);
  } finally {
    controller1.abort();
    controller2.abort();
  }
}
```

## Race Condition

Process whichever stream yields first:

```typescript
async function raceStreams() {
  const controller1 = new AbortController();
  const controller2 = new AbortController();
  
  const stream1 = new WebViewStream('https://api1.example.com/events', controller1.signal);
  const stream2 = new WebViewStream('https://api2.example.com/events', controller2.signal);
  
  try {
    await Promise.race([
      (async () => {
        for await (const event of stream1) {
          console.log('Stream 1 won:', event);
          controller2.abort(); // Stop the other stream
          break;
        }
      })(),
      (async () => {
        for await (const event of stream2) {
          console.log('Stream 2 won:', event);
          controller1.abort(); // Stop the other stream
          break;
        }
      })()
    ]);
  } finally {
    controller1.abort();
    controller2.abort();
  }
}
```

## Stream Manager

Manage multiple streams with a centralized manager:

```typescript
class StreamManager {
  private streams = new Map<string, AbortController>();
  
  async add(id: string, url: string, handler: (event: unknown) => void) {
    if (this.streams.has(id)) {
      throw new Error(`Stream ${id} already exists`);
    }
    
    const controller = new AbortController();
    this.streams.set(id, controller);
    
    const stream = new WebViewStream(url, controller.signal);
    
    (async () => {
      try {
        for await (const event of stream) {
          handler(event);
        }
      } catch (error) {
        console.error(`Stream ${id} error:`, error);
      } finally {
        this.streams.delete(id);
      }
    })();
  }
  
  remove(id: string) {
    const controller = this.streams.get(id);
    if (controller) {
      controller.abort();
      this.streams.delete(id);
    }
  }
  
  removeAll() {
    for (const controller of this.streams.values()) {
      controller.abort();
    }
    this.streams.clear();
  }
}

// Usage
const manager = new StreamManager();

await manager.add('notifications', 'https://api.example.com/notifications', (event) => {
  console.log('Notification:', event);
});

await manager.add('updates', 'https://api.example.com/updates', (event) => {
  console.log('Update:', event);
});

// Later
manager.remove('notifications');
manager.removeAll();
```

## See Also

- [API Reference](../api/webviewstream.md) - Complete API documentation
