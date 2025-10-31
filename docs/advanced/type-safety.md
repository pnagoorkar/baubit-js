# Type Safety

Implement type-safe event handling with `WebViewStream`.

## Define Event Types

Create TypeScript interfaces for your events:

```typescript
interface BaseEvent {
  type: string;
  timestamp: number;
}

interface NotificationEvent extends BaseEvent {
  type: 'notification';
  data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  };
}

interface UpdateEvent extends BaseEvent {
  type: 'update';
  data: {
    id: string;
    changes: Record<string, unknown>;
  };
}

type AppEvent = NotificationEvent | UpdateEvent;
```

## Type Guards

Implement type guards for runtime validation:

```typescript
function isNotificationEvent(event: unknown): event is NotificationEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    event.type === 'notification' &&
    'data' in event &&
    typeof event.data === 'object'
  );
}

function isUpdateEvent(event: unknown): event is UpdateEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    event.type === 'update'
  );
}
```

## Typed Stream Processing

Use type guards to process events safely:

```typescript
for await (const event of stream) {
  if (isNotificationEvent(event)) {
    // TypeScript knows event is NotificationEvent
    console.log(event.data.title);
    handleNotification(event);
  } else if (isUpdateEvent(event)) {
    // TypeScript knows event is UpdateEvent
    console.log(event.data.id);
    handleUpdate(event);
  } else {
    console.warn('Unknown event type:', event);
  }
}
```

## Validation with Zod

Use Zod for runtime validation:

```typescript
import { z } from 'zod';

const NotificationEventSchema = z.object({
  type: z.literal('notification'),
  timestamp: z.number(),
  data: z.object({
    title: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high'])
  })
});

type NotificationEvent = z.infer<typeof NotificationEventSchema>;

for await (const event of stream) {
  try {
    const notification = NotificationEventSchema.parse(event);
    handleNotification(notification);
  } catch (error) {
    console.error('Invalid event:', error);
  }
}
```

## Generic Stream Wrapper

Create a generic wrapper for type-safe streams:

```typescript
class TypedStream<T> {
  constructor(
    private stream: WebViewStream,
    private validator: (event: unknown) => event is T
  ) {}
  
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, void> {
    for await (const event of this.stream) {
      if (this.validator(event)) {
        yield event;
      } else {
        console.warn('Event failed validation:', event);
      }
    }
  }
}

// Usage
const typedStream = new TypedStream(
  new WebViewStream(url, signal),
  isNotificationEvent
);

for await (const event of typedStream) {
  // event is guaranteed to be NotificationEvent
  console.log(event.data.title);
}
```

## See Also

- [API Reference](../api/webviewstream.md) - Complete API documentation
- [Advanced Usage](error-handling.md) - Error handling patterns
