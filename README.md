# baubit-js

[![Build and Test - Main](https://github.com/pnagoorkar/baubit-js/actions/workflows/main.yml/badge.svg)](https://github.com/pnagoorkar/baubit-js/actions/workflows/main.yml)

[![codecov](https://codecov.io/gh/pnagoorkar/baubit-js/branch/main/graph/badge.svg)](https://codecov.io/gh/pnagoorkar/baubit-js)

[![npm version](https://img.shields.io/npm/v/baubit-js.svg)](https://www.npmjs.com/package/baubit-js)

A reusable TypeScript/JavaScript library for modern web applications. This library provides a collection of utilities and components that can be used across TypeScript and JavaScript projects.

## Features

- ✅ **TypeScript**: Full TypeScript support with type declarations
- ✅ **ESM**: Native ES Module support
- ✅ **Testing**: Jest with ts-jest for comprehensive testing
- ✅ **Linting**: ESLint with TypeScript support
- ✅ **Formatting**: Prettier for consistent code style
- ✅ **Build**: Automated build process with TypeScript compiler
- ✅ **Coverage**: Code coverage reporting with thresholds
- ✅ **CI/CD**: Automated workflows for building, testing, and releasing

## Installation

```bash
npm install baubit-js
```

## Getting Started

### WebViewStream

`WebViewStream` provides an EventSource-like interface for MAUI WebView environments where keep-alive streams are not supported when intercepting WebResource requests. It implements the AsyncIterable protocol for consuming server-sent events with full TypeScript generic support.

```typescript
import { WebViewStream } from 'baubit-js';

// Define your event type
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

**Key Features:**
- **Type Safety**: Generic support for type-safe event handling (`WebViewStream<T>`)
- **Session Management**: Automatically initializes with unique instance ID
- **Heartbeat Mechanism**: Maintains session health with configurable intervals
- **Async Iteration**: Native support for `for await...of` loops
- **Cancellation**: Uses standard `AbortSignal` for lifecycle control
- **Error Handling**: Throws errors for failed requests, allowing try-catch handling

See the [Wiki](https://github.com/pnagoorkar/baubit-js/wiki) for detailed documentation and examples.

### Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Build the project
npm run build

# Clean build artifacts
npm run clean
```

## Project Structure

```
.
├── src/              # Source files
│   └── index.ts      # Main entry point
├── tests/            # Test files
│   └── index.spec.ts # Example test
├── dist/             # Build output (generated)
├── coverage/         # Coverage reports (generated)
├── .gitignore        # Git ignore rules
├── .prettierrc.json  # Prettier configuration
├── .prettierignore   # Prettier ignore rules
├── eslint.config.js  # ESLint configuration
├── jest.config.cjs   # Jest configuration
├── tsconfig.json     # TypeScript configuration
├── package.json      # Package manifest
├── LICENSE           # MIT License
└── README.md         # This file
```

## Contributing

Contributions are welcome! Please ensure all tests pass and code follows the project's coding standards before submitting a pull request.

## Configuration

### Code Quality

This project maintains high code quality standards:
- TypeScript with strict type checking
- ESLint for code linting
- Prettier for code formatting
- Jest for testing with coverage thresholds (90% lines, 90% statements, 80% branches, 90% functions)

## License

MIT - see LICENSE file for details
