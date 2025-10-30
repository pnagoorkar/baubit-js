# baubit-js Wiki

Welcome to the baubit-js documentation! This wiki provides comprehensive information about the library and its components.

## Table of Contents

- [WebViewStream](#webviewstream)
  - [Overview](#overview)
  - [Use Case](#use-case)
  - [Getting Started](#getting-started)
  - [API Reference](#api-reference)
  - [Server Requirements](#server-requirements)
  - [Advanced Usage](#advanced-usage)
  - [Troubleshooting](#troubleshooting)

---

## WebViewStream

### Overview

`WebViewStream` is a specialized class designed to provide EventSource-like functionality in MAUI WebView environments where traditional keep-alive HTTP streams are not supported when intercepting WebResource requests.

The class implements the `AsyncIterable` interface, allowing you to consume server-sent events using modern JavaScript async iteration patterns (`for await...of` loops).

### Use Case

**Problem**: In .NET MAUI applications, when you intercept WebResource requests in a WebView, the platform doesn't support long-lived HTTP connections (like Server-Sent Events or WebSockets). This makes it challenging to implement real-time event streaming from your server to the WebView.

**Solution**: `WebViewStream` uses HTTP polling with intelligent session management and heartbeat mechanisms to simulate a continuous event stream while working within the constraints of MAUI WebView's resource interception.

### Getting Started

#### Installation

```bash
npm install baubit-js
```

#### Basic Usage

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

### API Reference

#### Constructor

```typescript
constructor(url: string, signal?: AbortSignal)
```

**Parameters:**
- `url` (string): The base URL for your event stream endpoint
- `signal` (AbortSignal, optional): Signal to control stream lifecycle and cancel operations

**Example:**
```typescript
const controller = new AbortController();
const stream = new WebViewStream('https://api.example.com/events', controller.signal);
```

#### Async Iterator

The class implements `AsyncIterable<unknown>`, allowing direct use in `for await...of` loops.

```typescript
for await (const event of stream) {
  // Process event
}
```

### Server Requirements

Your server needs to implement three endpoints to work with `WebViewStream`:

#### 1. Initialization Endpoint: `GET {baseUrl}/new`

Called once when the stream is created to set up the session.

**Response:**
```json
{
  "id": "unique-session-id",
  "heartbeatInterval": 30000
}
```

**Fields:**
- `id` (string): Unique identifier for this stream session
- `heartbeatInterval` (number): Milliseconds between heartbeat requests

**Example Implementation (Node.js/Express):**
```javascript
app.get('/events/new', (req, res) => {
  const sessionId = generateUniqueId();
  sessions.set(sessionId, { created: Date.now(), lastHeartbeat: Date.now() });
  
  res.json({
    id: sessionId,
    heartbeatInterval: 30000 // 30 seconds
  });
});
```

#### 2. Heartbeat Endpoint: `POST {baseUrl}/heartbeat`

Called periodically to maintain session health.

**Request Body:**
```json
{
  "id": "unique-session-id"
}
```

**Response:** Any successful response (200 OK)

**Example Implementation:**
```javascript
app.post('/events/heartbeat', (req, res) => {
  const { id } = req.body;
  const session = sessions.get(id);
  
  if (session) {
    session.lastHeartbeat = Date.now();
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});
```

#### 3. Events Endpoint: `POST {baseUrl}`

Called repeatedly to poll for new events.

**Request Body:**
```json
{
  "instanceId": "unique-session-id"
}
```

**Response:** Event data in JSON format
```json
{
  "type": "notification",
  "data": { "message": "Hello World" },
  "timestamp": 1234567890
}
```

**Example Implementation:**
```javascript
app.post('/events', (req, res) => {
  const { instanceId } = req.body;
  const session = sessions.get(instanceId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Get next event for this session (could be from a queue)
  const event = getNextEventForSession(instanceId);
  
  if (event) {
    res.json(event);
  } else {
    // No events available - client will poll again
    res.json({ type: 'keep-alive' });
  }
});
```

### Advanced Usage

#### Error Handling

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

#### Manual Iteration Control

For more control, you can manually iterate:

```typescript
const iterator = stream[Symbol.asyncIterator]();

while (true) {
  try {
    const result = await iterator.next();
    
    if (result.done) {
      console.log('Stream ended');
      break;
    }
    
    console.log('Event:', result.value);
    
    // Custom logic here
    await processEvent(result.value);
    
  } catch (error) {
    console.error('Error:', error);
    break;
  }
}
```

#### Conditional Streaming

Stop streaming based on event content:

```typescript
for await (const event of stream) {
  console.log('Event:', event);
  
  // Stop on specific event type
  if (event.type === 'stream-end') {
    controller.abort();
    break;
  }
  
  // Stop after certain number of events
  if (++eventCount >= maxEvents) {
    controller.abort();
    break;
  }
}
```

#### With Timeout

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

### Troubleshooting

#### Stream doesn't receive events

**Possible causes:**
1. Server not responding correctly to initialization endpoint
2. Session ID not being maintained properly on server
3. Events endpoint not returning data

**Solution:** Check server logs and ensure all three endpoints are implemented correctly.

#### Heartbeat failures

Heartbeat errors are silently ignored by design to prevent disrupting the main event stream. However, if your server requires active heartbeats:

**Ensure:**
- Heartbeat endpoint is accessible
- Session isn't expiring too quickly on the server
- Network connectivity is stable

#### High CPU usage

If experiencing high CPU usage:

**Recommendations:**
1. Increase `heartbeatInterval` in initialization response
2. Implement server-side event queuing to reduce empty polls
3. Add small delays in your event processing

#### Memory leaks

Always ensure you call `controller.abort()` when done:

```typescript
const controller = new AbortController();
const stream = new WebViewStream(url, controller.signal);

try {
  // Use stream
} finally {
  controller.abort(); // Always clean up!
}
```

---

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
