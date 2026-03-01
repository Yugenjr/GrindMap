# Contributing to GrindMap

Thank you for your interest in contributing to GrindMap! We welcome contributions from everyone.

## Code of Conduct

Please be respectful and constructive in all interactions with other contributors.

## How to Contribute

### Reporting Bugs

1. **Check if the bug has already been reported** in [Issues](../../issues)
2. If not, **create a new issue** with:
   - Clear title and description
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Your environment (OS, browser, Node.js version, etc.)

### Suggesting Features

1. **Check existing feature requests** in [Issues](../../issues)
2. **Create a new issue** describing:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative approaches you've considered
   - Example usage (if applicable)

### Making Code Changes

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/GrindMap.git`
3. **Create a feature branch**: `git checkout -b feature/YourFeatureName`
4. **Make your changes** - be clear and focused
5. **Test your changes** thoroughly
6. **Commit with a clear message**: `git commit -m 'Add descriptive commit message'`
7. **Push to your branch**: `git push origin feature/YourFeatureName`
8. **Open a Pull Request** against the `master` branch

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

```bash
git clone https://github.com/Yugenjr/GrindMap.git
cd GrindMap
npm install
```

### Running the Project

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Commit Message Guidelines

Please use clear and descriptive commit messages:

- `feat: Add new feature`
- `fix: Fix a bug`
- `docs: Update documentation`
- `style: Format code`
- `refactor: Refactor code without changing functionality`
- `test: Add or update tests`

## Pull Request Process

1. **Update the README.md** if adding/changing features
2. **Add tests** for new functionality
3. **Ensure all tests pass**: `npm test`
4. **Follow the code style** of the project
5. **Request reviews** from maintainers
6. **Respond to feedback** and make requested changes

## Code Style

- Use consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Follow ES6+ standards
- Keep functions small and focused

## Testing and Code Quality

To ensure high-quality contributions and maintain code reliability, follow these guidelines for testing and code quality checks.

### Running Tests

- **Backend Tests**: Navigate to the `backend` directory and run `npm test`. This executes Jest tests configured in `backend/jest.config.json`, which includes unit and integration tests for Node.js components.
- **Frontend Tests**: Navigate to the `frontend` directory and run `npm test`. This runs Jest tests for React components and utilities.
- Ensure all tests pass before submitting a pull request. Use `npm run test:watch` for continuous testing during development.

### Writing Tests

- Use **Jest** as the primary testing framework for both backend and frontend.
- **Unit Tests**: Test individual functions, modules, or components in isolation. Place test files alongside source files or in `__tests__` directories, following patterns like `**/__tests__/**/*.js` or `**/?(*.)+(spec|test).js` as defined in `backend/jest.config.json`.
- **Integration Tests**: Test interactions between components, such as API endpoints or scraper services.
- **Backend-Specific Testing**:
  - For scraping services in `backend/src/services/scraping/`, use Jest mocks to simulate external dependencies (e.g., network requests or browser interactions) to ensure reliability and avoid real API calls during testing.
  - Example: Mock Puppeteer or HTTP requests in scraper tests to test error handling, data parsing, and security without hitting live endpoints.
  - Test API security by mocking authentication and verifying input validation.
- Reference `backend/jest.config.json` for configuration details, including coverage collection from `src/**/*.js` (excluding `server.js`) and output formats (text, lcov, html).

### Linting and Code Quality

- Use **ESLint** to enforce code style and catch potential issues.
- **Running Linter**: Run `npx eslint .` in the respective directory (backend or frontend) to check for linting errors.
- **Fixing Issues**: Use `npx eslint . --fix` to automatically resolve fixable problems.
- Reference `backend/.eslintrc.json` for backend ESLint configuration, which extends `eslint:recommended` and includes rules for unused variables, equality checks, console usage, const preference, camelcase, consistent returns, magic numbers, line length, duplicate imports, and template literals.
- Ensure code passes linting checks before committing.

### Code Review Guidelines

- **Test Coverage**: Pull requests must include test coverage reports generated by Jest (e.g., via `npm test -- --coverage`). Aim for adequate coverage, especially for new features and critical paths.
- **Security Audits**: Run `backend/security-audit.sh` to perform comprehensive security checks, including npm audit, outdated package detection, and license compliance. Address any critical or high-severity vulnerabilities before merging.
- Reviewers will check for adherence to these practices during pull request reviews.

## Areas for Contribution

- 🐛 **Bug Fixes**: Help fix existing issues
- ✨ **New Features**: Implement requested features
- 📚 **Documentation**: Improve README and guides
- 🎨 **UI/UX**: Enhance user interface
- 🧪 **Testing**: Write unit and integration tests
- 🌐 **Localization**: Translate to other languages


## Debugging Guide

For help with common debugging issues, setup problems, and troubleshooting tips, please refer to our [**Contributor Debugging Playground**](./CONTRIBUTOR_DEBUGGING.md). This guide covers:

- Environment setup troubleshooting
- Frontend and backend debugging techniques
- Scraper debugging tips
- Database issue resolution
- Development tools and best practices

## Getting Help

- Check [Discussions](../../discussions) for common questions
- Open an [Issue](../../issues) if you're stuck
- Reach out to the maintainers
- Refer to [Contributor Debugging Playground](./CONTRIBUTOR_DEBUGGING.md) for debugging help

## Recognition

Contributors will be recognized in:
- The project's README
- Release notes
- GitHub contributors page

---

**Thank you for contributing to GrindMap!** 🎉
