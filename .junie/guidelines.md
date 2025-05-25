# Development Guidelines for Genius-DT

This document provides guidelines and information for developers working on the Genius-DT project.

## Build/Configuration Instructions

### Prerequisites
- Node.js (latest LTS version recommended)
- npm (comes with Node.js)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
To start the development server:
```bash
npm run dev
```
This will start a Vite development server with hot module replacement.

### Building for Production
To build the project for production:
```bash
npm run build
```
This will:
1. Run TypeScript compiler to check types
2. Build the project using Vite

### Preview Production Build
To preview the production build locally:
```bash
npm run preview
```

## Testing Information

### Testing Setup
The project uses Vitest for testing, which is configured to work with the Vite build system.

### Running Tests
To run all tests once:
```bash
npm test
```

To run tests in watch mode (tests will re-run when files change):
```bash
npm run test:watch
```

### Adding New Tests
1. Create test files in the `test` directory
2. Name test files with the `.test.ts` extension
3. Use the Vitest API for writing tests

### Example Test
Here's a simple example test for the `counter.ts` module:

```typescript
// test/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setupCounter } from '../src/counter'

describe('setupCounter', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    // Create a fresh button element before each test
    button = document.createElement('button')
    document.body.appendChild(button)
  })

  it('should initialize counter with 0', () => {
    setupCounter(button)
    expect(button.innerHTML).toBe('count is 0')
  })

  it('should increment counter when clicked', () => {
    setupCounter(button)
    
    // Initial state
    expect(button.innerHTML).toBe('count is 0')
    
    // Simulate a click
    button.click()
    
    // Counter should be incremented
    expect(button.innerHTML).toBe('count is 1')
  })
})
```

## Code Style and Development Practices

### Project Structure
- `src/`: Source code
  - `modules/`: Core modules like GeniusWorld, MoverManager, etc.
  - `Extensions/`: Extensions for the core functionality
  - `assets/`: Static assets
  - `styles/`: CSS styles
  - `utils/`: Utility functions
- `public/`: Static files served directly
- `test/`: Test files

### TypeScript Configuration
The project uses TypeScript with strict type checking. Key TypeScript configuration includes:
- Target: ES2020
- Module: ESNext
- Strict type checking enabled
- Checks for unused locals and parameters

### Code Style
- Use TypeScript for type safety
- Follow object-oriented programming principles
- Use clear, descriptive variable and function names
- Add comments with checkmarks (✅) to indicate completed steps
- Use async/await for asynchronous operations
- Use event-driven architecture with the event bus pattern

### 3D Rendering
The project uses Three.js for 3D rendering. Key practices include:
- Encapsulate Three.js functionality in dedicated classes
- Use the GeniusWorld class as the main entry point for 3D operations
- Separate concerns between rendering, object management, and user interaction

### Extension System
The project uses an extension system to add functionality:
- Extensions are added to GeniusWorld using `addExtension`
- Extensions can be activated/deactivated as needed
- Common extensions include sensor visualization, UI panels, etc.

### Event Handling
The project uses an event bus (mitt) for communication between components:
- Use `eventBus.on` to subscribe to events
- Use `eventBus.emit` to publish events
- Common events include "hover", "unhover", "sensorSelected", etc.