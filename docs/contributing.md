# Contributing to baubit-js

We welcome contributions! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 16.x or later
- npm, yarn, or pnpm
- Git

### Clone the Repository

```bash
git clone https://github.com/pnagoorkar/baubit-js.git
cd baubit-js
```

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

## Development Commands

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

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Your Changes

- Write code in `src/`
- Add tests in `tests/`
- Update documentation

### 3. Run Quality Checks

```bash
npm run lint:fix
npm run format
npm test
npm run build
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `chore:` Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/my-new-feature
```

Then create a Pull Request on GitHub.

## Code Quality Standards

### TypeScript

- Use strict type checking
- Avoid `any` types
- Document public APIs with JSDoc

### Testing

- Maintain 90%+ code coverage
- Write tests for new features
- Test edge cases

### Code Style

- Run Prettier before committing
- Follow existing code patterns
- Keep functions small and focused

## Documentation

Update documentation when adding features:

- JSDoc comments in code
- README.md for user-facing changes
- MkDocs documentation in `docs/`

## Questions?

Open an issue on [GitHub](https://github.com/pnagoorkar/baubit-js/issues) for questions or discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
