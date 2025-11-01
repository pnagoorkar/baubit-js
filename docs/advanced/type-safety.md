# Type Safety

Implement type-safe event handling with `WebViewStream` using generics.

## Using Generic Type Parameter

`WebViewStream` is a generic class that accepts a type parameter for compile-time type safety:

```typescript
interface MyEvent {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}

// Create a typed stream
const stream = new WebViewStream<MyEvent>(url, signal);

// TypeScript knows event is MyEvent
for await (const event of stream) {
  console.log(event.id); // ✓ Type-safe
  console.log(event.type); // ✓ Type-safe
  console.log(event.data); // ✓ Type-safe
}
```

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

// Create a typed stream with union type
const stream = new WebViewStream<AppEvent>(url, signal);
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

Use type guards to process events safely with a typed stream:

```typescript
const stream = new WebViewStream<AppEvent>(url, signal);

for await (const event of stream) {
  // TypeScript knows event is AppEvent (NotificationEvent | UpdateEvent)
  if (isNotificationEvent(event)) {
    // TypeScript narrows to NotificationEvent
    console.log(event.data.title);
    handleNotification(event);
  } else if (isUpdateEvent(event)) {
    // TypeScript narrows to UpdateEvent
    console.log(event.data.id);
    handleUpdate(event);
  } else {
    // TypeScript knows this branch shouldn't happen with proper types
    console.warn('Unknown event type:', event);
  }
}
```

## Validation with Zod

Use Zod for runtime validation with a typed stream:

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

// Use the inferred type with WebViewStream
const stream = new WebViewStream<NotificationEvent>(url, signal);

for await (const event of stream) {
  try {
    // Runtime validation (event is already typed as NotificationEvent at compile time)
    const notification = NotificationEventSchema.parse(event);
    handleNotification(notification);
  } catch (error) {
    console.error('Invalid event:', error);
  }
}
```

## Runtime Validation Wrapper

Create a wrapper that combines compile-time and runtime type safety:

```typescript
class ValidatedStream<T> {
  constructor(
    private stream: WebViewStream<T>,
    private validator: (event: unknown) => event is T
  ) {}
  
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, void> {
    for await (const event of this.stream) {
      // Runtime validation even though TypeScript thinks it's already type T
      if (this.validator(event)) {
        yield event;
      } else {
        console.warn('Event failed runtime validation:', event);
      }
    }
  }
}

// Usage
const baseStream = new WebViewStream<NotificationEvent>(url, signal);
const validatedStream = new ValidatedStream(baseStream, isNotificationEvent);

for await (const event of validatedStream) {
  // event is guaranteed to be NotificationEvent at both compile-time and runtime
  console.log(event.data.title);
}
```

## Direct Generic Usage (Recommended)

For most use cases, using the generic parameter directly is sufficient:

```typescript
interface MyEvent {
  id: string;
  message: string;
}

const stream = new WebViewStream<MyEvent>(url, signal);

for await (const event of stream) {
  // Full type safety without additional wrappers
  console.log(event.id, event.message);
}
```

## See Also

- [API Reference](../api/webviewstream.md) - Complete API documentation
- [Advanced Usage](error-handling.md) - Error handling patterns
