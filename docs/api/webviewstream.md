# WebViewStream API Reference

Complete API documentation for the `WebViewStream` class.

## Class: WebViewStream

`WebViewStream` provides an EventSource-like interface for MAUI WebView environments where keep-alive streams are not supported when intercepting WebResource requests.

### Constructor

```typescript
constructor(url: string, signal?: AbortSignal)
```

Creates a new WebViewStream instance.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | The base URL for your event stream endpoint |
| `signal` | `AbortSignal` | No | Signal to control stream lifecycle and cancel operations |

#### Example

```typescript
// Basic usage
const stream = new WebViewStream('https://api.example.com/events');

// With cancellation support
const controller = new AbortController();
const stream = new WebViewStream('https://api.example.com/events', controller.signal);
// Later: controller.abort() to stop the stream
```

#### Behavior

Upon construction, the stream:

1. Makes a GET request to `{url}/new` to obtain session configuration
2. Receives a unique instance ID and heartbeat interval
3. Automatically starts the heartbeat timer
4. Sets up abort listener to clean up when signal is triggered

---

## Async Iterator

The class implements `AsyncIterable<unknown>`, allowing direct use in `for await...of` loops.

### Usage

```typescript
for await (const event of stream) {
  // Process event
}
```

### Iteration Behavior

Each iteration:

- Waits for initialization to complete (on first iteration)
- Makes a POST request to `{url}` with the session ID
- Waits for server response
- Yields the received data
- Continues while `signal.aborted === false`

### Return Type

The iterator yields values of type `unknown`. You should validate or cast the data as needed:

```typescript
interface MyEvent {
  type: string;
  data: unknown;
}

for await (const event of stream) {
  const typedEvent = event as MyEvent;
  // Use typedEvent...
}
```

---

## Error Handling

### Thrown Errors

The stream throws errors in the following cases:

| Error Type | Condition | Message Format |
|------------|-----------|----------------|
| `Error` | Non-OK HTTP response during initialization | `HTTP {status}: {statusText}` |
| `Error` | Non-OK HTTP response during polling | `HTTP {status}: {statusText}` |
| `Error` | Network failure | Varies based on network error |

### Example

```typescript
try {
  for await (const event of stream) {
    // Process event
  }
} catch (error) {
  console.error('Stream error:', error);
  // Handle error
}
```

---

## Manual Iteration

For more control, you can manually iterate using the iterator protocol:

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
    await processEvent(result.value);
    
  } catch (error) {
    console.error('Error:', error);
    break;
  }
}
```

---

## Request/Response Format

### Initialization Request

**Method**: `GET`  
**URL**: `{baseUrl}/new`

**Response**:
```json
{
  "id": "unique-session-id",
  "heartbeatInterval": 30000
}
```

### Heartbeat Request

**Method**: `POST`  
**URL**: `{baseUrl}/heartbeat`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "id": "unique-session-id"
}
```

**Response**: Any 200 OK response

### Polling Request

**Method**: `POST`  
**URL**: `{baseUrl}`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "instanceId": "unique-session-id"
}
```

**Response**: Any JSON data

---

## Type Definitions

```typescript
// The class implements AsyncIterable
interface AsyncIterable<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

// AsyncIterator protocol
interface AsyncIterator<T> {
  next(): Promise<IteratorResult<T>>;
}

// IteratorResult
interface IteratorResult<T> {
  done: boolean;
  value: T;
}
```

---

## See Also

- [Getting Started](../getting-started/quick-start.md) - Basic usage examples
- [Server Requirements](../server/overview.md) - Required server endpoints
- [Advanced Usage](../advanced/error-handling.md) - Advanced patterns
