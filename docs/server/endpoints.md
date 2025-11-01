# Server Endpoints

Detailed specifications for the three required server endpoints.

## 1. Initialization Endpoint

### Request

**Method**: `GET`  
**URL**: `{baseUrl}/new`  
**Headers**: None required

### Response

**Status**: 200 OK  
**Content-Type**: `application/json`

```json
{
  "id": "unique-session-id",
  "heartbeatInterval": 30000
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for this stream session |
| `heartbeatInterval` | `number` | Milliseconds between heartbeat requests |

### Implementation Example

```javascript
app.get('/events/new', (req, res) => {
  const sessionId = generateUniqueId();
  sessions.set(sessionId, { 
    created: Date.now(), 
    lastHeartbeat: Date.now() 
  });
  
  res.json({
    id: sessionId,
    heartbeatInterval: 30000 // 30 seconds
  });
});
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 500 | Server error creating session |

---

## 2. Heartbeat Endpoint

### Request

**Method**: `POST`  
**URL**: `{baseUrl}/heartbeat`  
**Content-Type**: `application/json`

```json
{
  "id": "unique-session-id"
}
```

#### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Session ID from initialization |

### Response

**Status**: 200 OK

Any successful response is acceptable. The response body is ignored.

### Implementation Example

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

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Session not found |
| 400 | Invalid request body |

---

## 3. Events Endpoint

### Request

**Method**: `POST`  
**URL**: `{baseUrl}`  
**Content-Type**: `application/json`

```json
{
  "instanceId": "unique-session-id"
}
```

#### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `instanceId` | `string` | Yes | Session ID from initialization |

### Response

**Status**: 200 OK  
**Content-Type**: `application/json`

Event data in JSON format:

```json
{
  "type": "notification",
  "data": { "message": "Hello World" },
  "timestamp": 1234567890
}
```

The response can be any JSON-serializable data. A common pattern is to include a `type` field to distinguish between different event types.

### Keep-Alive Response

When no events are available, return a keep-alive message:

```json
{
  "type": "keep-alive"
}
```

### Implementation Example

```javascript
app.post('/events', (req, res) => {
  const { instanceId } = req.body;
  const session = sessions.get(instanceId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Get next event for this session (from queue, database, etc.)
  const event = getNextEventForSession(instanceId);
  
  if (event) {
    res.json(event);
  } else {
    // No events available - client will poll again
    res.json({ type: 'keep-alive' });
  }
});
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Session not found |
| 400 | Invalid request body |
| 500 | Server error retrieving events |

---

## Testing Endpoints

Use `curl` to test your endpoints:

### Test Initialization

```bash
curl -X GET http://localhost:3000/events/new
```

Expected response:
```json
{
  "id": "session-1234567890",
  "heartbeatInterval": 30000
}
```

### Test Heartbeat

```bash
curl -X POST http://localhost:3000/events/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"id":"session-1234567890"}'
```

Expected response: 200 OK

### Test Events

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"session-1234567890"}'
```

Expected response:
```json
{
  "type": "notification",
  "data": {...}
}
```

---

## See Also

- [Overview](overview.md) - Server implementation overview
- [Examples](examples.md) - Complete implementation examples
