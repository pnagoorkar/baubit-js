# Installation

## Requirements

- Node.js 16.x or later
- npm, yarn, or pnpm

## Install via npm

```bash
npm install baubit-js
```

## Install via yarn

```bash
yarn add baubit-js
```

## Install via pnpm

```bash
pnpm add baubit-js
```

## Verify Installation

After installation, verify that the package is correctly installed:

```bash
npm list baubit-js
```

You should see the installed version in your `node_modules`.

## TypeScript Support

baubit-js is written in TypeScript and includes type definitions out of the box. No additional `@types` packages are needed.

## Browser Compatibility

Since baubit-js uses the `fetch` API and `AbortSignal`, it requires:

- Modern browsers (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+)
- Node.js 18+ (or Node.js 16+ with polyfills)

## MAUI WebView

baubit-js is specifically designed for use in .NET MAUI WebView environments. Ensure your MAUI project is configured to intercept WebResource requests.

## Next Steps

Once installed, proceed to the [Quick Start](quick-start.md) guide to learn how to use WebViewStream.
