# TypeScript NPM Package Template

A modern, production-ready TypeScript npm package template with ESM support, comprehensive testing, and code quality tools.

## Features

- ✅ **TypeScript**: Full TypeScript support with type declarations
- ✅ **ESM**: Native ES Module support
- ✅ **Testing**: Jest with ts-jest for unit testing
- ✅ **Linting**: ESLint with TypeScript support
- ✅ **Formatting**: Prettier for consistent code style
- ✅ **Build**: Automated build process with TypeScript compiler
- ✅ **Coverage**: Code coverage reporting with thresholds
- ✅ **CI/CD Ready**: Pre-configured scripts for continuous integration

## Getting Started

### Use This Template

1. Click "Use this template" button on GitHub
2. Clone your new repository
3. Update `package.json`:
   - Change `name` from `REPLACE_ME` to your package name
   - Update `version`, `description`, `author`, and `keywords`
   - Update repository URLs
4. Install dependencies: `npm install`
5. Start developing!

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

## Publishing to NPM

Before publishing:

1. Update version in `package.json`
2. Ensure all tests pass: `npm test`
3. Build the package: `npm run build`
4. Test locally: `npm pack` and install in another project

Then publish:

```bash
npm publish
```

The `prepublishOnly` script automatically runs linting, formatting checks, tests, and build before publishing.

## Configuration

### TypeScript

The `tsconfig.json` is configured for modern ES2020 with strict type checking. Adjust compiler options as needed for your project.

### Jest

Coverage thresholds are set to:
- Lines: 90%
- Statements: 90%
- Branches: 80%
- Functions: 90%

Adjust these in `jest.config.cjs` based on your needs.

### ESLint & Prettier

ESLint uses TypeScript-specific rules with recommended configurations. Prettier is integrated to avoid conflicts. Customize rules in `eslint.config.js` and `.prettierrc.json`.

## License

MIT - see LICENSE file for details
