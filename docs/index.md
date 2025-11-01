# Welcome to baubit-js

[![Build and Test](https://github.com/pnagoorkar/baubit-js/actions/workflows/main.yml/badge.svg)](https://github.com/pnagoorkar/baubit-js/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/pnagoorkar/baubit-js/branch/main/graph/badge.svg)](https://codecov.io/gh/pnagoorkar/baubit-js)
[![npm version](https://img.shields.io/npm/v/baubit-js.svg)](https://www.npmjs.com/package/baubit-js)

A TypeScript/JavaScript library providing utilities for modern web applications, with a focus on MAUI WebView environments.

## Overview

**baubit-js** is a reusable TypeScript library that provides `WebViewStream` - an EventSource-like interface for HTTP polling in MAUI WebView environments where keep-alive streams are not supported when intercepting WebResource requests.

## Key Features

- ✅ **TypeScript**: Full TypeScript support with generic type safety (`WebViewStream<T>`)
- ✅ **ESM**: Native ES Module support
- ✅ **AsyncIterable**: Modern async iteration patterns
- ✅ **Session Management**: Automatic session initialization and heartbeat
- ✅ **Cancellation**: Standard AbortSignal support
- ✅ **Error Handling**: Comprehensive error handling with try-catch
- ✅ **Testing**: 91%+ code coverage with comprehensive test suite

## Use Case

### The Problem

In .NET MAUI applications, when you intercept WebResource requests in a WebView, the platform doesn't support long-lived HTTP connections (like Server-Sent Events or WebSockets). This makes it challenging to implement real-time event streaming from your server to the WebView.

### The Solution

`WebViewStream` uses HTTP polling with intelligent session management and heartbeat mechanisms to simulate a continuous event stream while working within the constraints of MAUI WebView's resource interception.

## Quick Example

```typescript
import { WebViewStream } from 'baubit-js';

// Define your event type for type safety
interface MyEvent {
  id: string;
  message: string;
  timestamp: number;
}

const controller = new AbortController();
const stream = new WebViewStream<MyEvent>('https://api.example.com/events', controller.signal);

try {
  for await (const event of stream) {
    console.log('Received event:', event.message); // TypeScript knows event is MyEvent
    // Process event...
  }
} catch (error) {
  console.error('Stream error:', error);
} finally {
  controller.abort(); // Clean up
}
```

## Next Steps

- [Installation](getting-started/installation.md) - Get started with baubit-js
- [Quick Start](getting-started/quick-start.md) - Learn the basics
- [API Reference](api/webviewstream.md) - Explore the API
- [Server Implementation](server/overview.md) - Set up your server

## License

This project is licensed under the MIT License.
