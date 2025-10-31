# Quick Start

This guide will help you get started with `WebViewStream` in minutes.

## Basic Usage

```typescript
import { WebViewStream } from 'baubit-js';

// Create an AbortController for lifecycle management
const controller = new AbortController();

// Initialize the stream
const stream = new WebViewStream('https://api.example.com/events', controller.signal);

// Consume events
try {
  for await (const event of stream) {
    console.log('Received event:', event);
    
    // Process your event here
    handleEvent(event);
    
    // Optionally stop the stream based on some condition
    if (shouldStop(event)) {
      controller.abort();
      break;
    }
  }
} catch (error) {
  console.error('Stream error:', error);
} finally {
  // Clean up (abort will stop heartbeat and polling)
  controller.abort();
}
```

## How It Works

When you create a `WebViewStream`, the following happens automatically:

### 1. Initialization
The constructor makes a GET request to `{url}/new` to:

- Get a unique session ID
- Receive the heartbeat interval configuration

### 2. Heartbeat
A timer automatically starts, sending heartbeat requests to `{url}/heartbeat` at the configured interval to maintain session health.

### 3. Event Polling
Each iteration of the `for await...of` loop:

- Makes a POST request to `{url}` with the session ID
- Waits for the server response
- Yields the received data

### 4. Cancellation
When you call `controller.abort()`:

- The heartbeat timer stops
- The polling loop exits
- All resources are cleaned up

## Event Structure

The events yielded by the stream can be any JSON-serializable data. A common pattern is:

```typescript
interface Event {
  type: string;
  data: unknown;
  timestamp: number;
}

for await (const event of stream) {
  const typedEvent = event as Event;
  
  switch (typedEvent.type) {
    case 'notification':
      handleNotification(typedEvent.data);
      break;
    case 'update':
      handleUpdate(typedEvent.data);
      break;
    case 'keep-alive':
      // Heartbeat event, can be ignored
      break;
  }
}
```

## Error Handling

Errors during polling will throw and can be caught:

```typescript
try {
  for await (const event of stream) {
    // Process event
  }
} catch (error) {
  if (error.message.includes('HTTP 404')) {
    console.error('Session not found - may have expired');
  } else if (error.message.includes('HTTP 500')) {
    console.error('Server error:', error);
  } else {
    console.error('Network error:', error);
  }
}
```

## Timeout Example

Implement a timeout mechanism:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  console.log('Stream timeout');
  controller.abort();
}, 60000); // 60 second timeout

try {
  for await (const event of stream) {
    console.log('Event:', event);
  }
} finally {
  clearTimeout(timeoutId);
  controller.abort();
}
```

## Next Steps

- [API Reference](../api/webviewstream.md) - Complete API documentation
- [Server Implementation](../server/overview.md) - Set up your server
- [Advanced Usage](../advanced/error-handling.md) - Advanced patterns
