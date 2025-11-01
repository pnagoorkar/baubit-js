# Troubleshooting

Common issues and solutions when using `WebViewStream`.

## Stream Doesn't Receive Events

**Symptoms:**
- Stream connects but no events are received
- Loop never yields any data

**Solutions:**

1. **Check server logs** - Verify all three endpoints are being called
2. **Test endpoints directly** - Use curl or Postman
3. **Verify response format** - Ensure initialization returns proper JSON
4. **Check session storage** - Verify server stores/retrieves sessions correctly

```bash
# Test initialization
curl -X GET http://localhost:3000/events/new

# Test heartbeat
curl -X POST http://localhost:3000/events/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"id":"test-session"}'

# Test events
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"test-session"}'
```

## Heartbeat Failures

**Symptoms:**
- Errors in server logs about missing sessions
- Sessions expiring unexpectedly

**Understanding:** Heartbeat errors are silently ignored by design.

**Solutions:**

1. Check heartbeat endpoint is accessible
2. Increase heartbeat interval in server response
3. Ensure server doesn't expire sessions too quickly
4. Verify network connectivity

## High CPU Usage

**Symptoms:**
- Browser/app consuming excessive CPU
- Device heating up

**Solutions:**

1. **Increase heartbeat interval** (server-side)
2. **Implement server-side event queuing**
3. **Add client-side throttling**

```typescript
for await (const event of stream) {
  await processEvent(event);
  // Small delay between iterations
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

## Memory Leaks

**Symptoms:**
- Memory usage grows over time
- Application becomes sluggish

**Solution:** Always call `controller.abort()`

```typescript
const controller = new AbortController();

try {
  const stream = new WebViewStream(url, controller.signal);
  // Use stream
} finally {
  controller.abort(); // Always!
}
```

## Session Not Found Errors

**Symptoms:**
- "HTTP 404: Not Found" during polling
- Session works initially then fails

**Solutions:**

1. Implement session persistence (Redis/database)
2. Increase session TTL
3. Implement reconnection logic

```typescript
async function streamWithReconnect(url: string) {
  while (true) {
    const controller = new AbortController();
    try {
      const stream = new WebViewStream(url, controller.signal);
      for await (const event of stream) {
        console.log(event);
      }
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('Session expired, reconnecting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    } finally {
      controller.abort();
    }
  }
}
```

## Need Help?

- Check the [API Reference](api/webviewstream.md)
- Review [Advanced Usage](advanced/error-handling.md)
- Open an issue on [GitHub](https://github.com/pnagoorkar/baubit-js/issues)
