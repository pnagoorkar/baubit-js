# Error Handling

Comprehensive error handling patterns for `WebViewStream`.

## Basic Error Handling

Errors during polling will throw and can be caught:

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

## Specific Error Types

### HTTP Errors

Handle different HTTP status codes:

```typescript
try {
  for await (const event of stream) {
    // Process event
  }
} catch (error) {
  if (error.message.includes('HTTP 404')) {
    console.error('Session not found - may have expired');
    // Maybe create a new session
  } else if (error.message.includes('HTTP 500')) {
    console.error('Server error:', error);
    // Maybe retry after delay
  } else if (error.message.includes('HTTP 503')) {
    console.error('Service unavailable:', error);
    // Maybe exponential backoff retry
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Network Errors

Handle network failures:

```typescript
try {
  for await (const event of stream) {
    // Process event
  }
} catch (error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    console.error('Network error - check connection');
  } else if (error.name === 'AbortError') {
    console.log('Stream was aborted');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Retry Logic

### Simple Retry

Retry a fixed number of times:

```typescript
async function streamWithRetry(url: string, maxRetries = 3) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    const controller = new AbortController();
    
    try {
      const stream = new WebViewStream(url, controller.signal);
      
      for await (const event of stream) {
        console.log('Event:', event);
        attempts = 0; // Reset on successful event
      }
      
      break; // Exit if stream completes normally
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, error);
      
      if (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      controller.abort();
    }
  }
  
  if (attempts >= maxRetries) {
    throw new Error('Max retry attempts reached');
  }
}
```

### Exponential Backoff

Implement exponential backoff for retries:

```typescript
async function streamWithBackoff(url: string, maxAttempts = 5) {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    const controller = new AbortController();
    
    try {
      const stream = new WebViewStream(url, controller.signal);
      
      for await (const event of stream) {
        console.log('Event:', event);
        attempt = 0; // Reset on success
      }
      
      break;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } finally {
      controller.abort();
    }
  }
}
```

## Error Recovery

### Graceful Degradation

Handle errors gracefully without crashing:

```typescript
async function resilientStream(url: string) {
  const controller = new AbortController();
  const stream = new WebViewStream(url, controller.signal);
  
  try {
    for await (const event of stream) {
      try {
        // Process event with its own error handling
        await processEvent(event);
      } catch (processingError) {
        console.error('Error processing event:', processingError);
        // Continue with next event instead of crashing
      }
    }
  } catch (streamError) {
    console.error('Stream error:', streamError);
    // Handle stream-level error
  } finally {
    controller.abort();
  }
}
```

### Fallback Mechanism

Provide fallback behavior when streaming fails:

```typescript
async function streamWithFallback(url: string) {
  const controller = new AbortController();
  
  try {
    const stream = new WebViewStream(url, controller.signal);
    
    for await (const event of stream) {
      console.log('Streaming event:', event);
    }
  } catch (error) {
    console.error('Streaming failed, switching to polling:', error);
    
    // Fallback to simple periodic polling
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Polled event:', data);
      } catch (pollError) {
        console.error('Polling failed:', pollError);
        clearInterval(pollInterval);
      }
    }, 5000);
  } finally {
    controller.abort();
  }
}
```

## Event-Level Error Handling

### Validate Events

Validate event structure before processing:

```typescript
interface ExpectedEvent {
  type: string;
  data: unknown;
}

function isValidEvent(event: unknown): event is ExpectedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    typeof event.type === 'string'
  );
}

for await (const event of stream) {
  if (!isValidEvent(event)) {
    console.error('Invalid event structure:', event);
    continue;
  }
  
  // Process validated event
  processEvent(event);
}
```

### Skip Malformed Events

Continue streaming even if some events are malformed:

```typescript
for await (const event of stream) {
  try {
    const validatedEvent = validateAndParse(event);
    await processEvent(validatedEvent);
  } catch (error) {
    console.error('Skipping malformed event:', error);
    // Log for debugging but continue streaming
    logMalformedEvent(event, error);
  }
}
```

## Timeout Handling

### Per-Event Timeout

Timeout individual event processing:

```typescript
async function processWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}

for await (const event of stream) {
  try {
    await processWithTimeout(processEvent(event), 5000);
  } catch (error) {
    if (error.message === 'Timeout') {
      console.error('Event processing timed out');
    }
  }
}
```

## See Also

- [Reconnection](reconnection.md) - Advanced reconnection patterns
- [API Reference](../api/webviewstream.md) - Complete API documentation
- [Troubleshooting](../troubleshooting.md) - Common issues
