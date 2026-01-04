# Backend Unit Tests

This directory contains comprehensive unit tests for the LearnBase backend application.

## Test Structure

```
src/__tests__/
├── setup.ts                    # Test configuration and setup
├── utils/                      # Utility function tests
│   ├── validation.test.ts      # Validation utilities
│   ├── auth.test.ts            # Authentication utilities
│   └── ai.test.ts              # AI streaming utilities
├── routes/                     # Route handler tests
│   ├── auth.test.ts            # Auth routes
│   ├── onboarding.test.ts      # Onboarding routes
│   └── users.test.ts           # User routes
└── websocket/                  # WebSocket handler tests
    └── learningHandler.test.ts # Learning flow handlers
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run specific test file

```bash
npm test -- validation.test.ts
```

### Run specific test case

```bash
npm test -- --testNamePattern="should validate email"
```

## Test Coverage

The test suite includes **70 comprehensive tests** covering:

### Utility Functions (100% coverage)

- ✅ Email validation
- ✅ Password validation (length, numbers, special characters)
- ✅ Input validation
- ✅ Learning interests validation
- ✅ User lockout functionality
- ✅ JWT token generation and verification
- ✅ AI streaming with GROQ API
- ✅ JSON parsing from AI responses

### Route Handlers

- ✅ Authentication endpoints (`/api/auth/me`)
- ✅ Onboarding endpoints (status, update, complete)
- ✅ User management endpoints (update profile, last session, delete account)

### WebSocket Handlers

- ✅ Learning session initialization
- ✅ Topic selection
- ✅ Session resumption
- ✅ User message handling
- ✅ Topic generation
- ✅ Visualizer checks
- ✅ Error handling
- ✅ New chat flow

## Test Technologies

- **Jest**: Testing framework
- **ts-jest**: TypeScript support for Jest
- **Supertest**: HTTP assertion library for route testing
- **Mock Functions**: Comprehensive mocking of Prisma, GROQ API, and WebSocket connections

## Writing New Tests

### Example: Testing a utility function

```typescript
import { myFunction } from "../../utils/myModule";

describe("My Module", () => {
  describe("myFunction", () => {
    it("should return expected result", () => {
      const result = myFunction("input");
      expect(result).toBe("expected");
    });

    it("should handle edge cases", () => {
      expect(myFunction("")).toBe("default");
      expect(myFunction(null)).toThrow();
    });
  });
});
```

### Example: Testing a route

```typescript
import request from "supertest";
import express from "express";
import myRouter from "../../routes/myRoute";
import { generateToken } from "../../utils/auth";

describe("My Route", () => {
  let app: express.Application;
  let authToken: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/my-route", myRouter);

    authToken = generateToken({
      userId: "test-user",
      email: "test@example.com",
    });
  });

  it("should return data for authenticated user", async () => {
    const response = await request(app)
      .get("/api/my-route")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
  });
});
```

## Mocking Best Practices

### Mocking Prisma

```typescript
jest.mock("../../config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
```

### Mocking External APIs

```typescript
jest.mock("../../utils/ai", () => ({
  streamChatCompletion: jest.fn(),
}));
```

### Mocking WebSocket

```typescript
const mockWs = {
  send: jest.fn((data: string) => {
    sentMessages.push(JSON.parse(data));
  }),
  userId: "test-user-123",
  readyState: 1, // WebSocket.OPEN
} as any;
```

## Common Issues and Solutions

### Issue: Module not found

**Solution**: Ensure import paths use correct relative paths from `__tests__` directory

```typescript
// Correct
import { myFunction } from "../../utils/myModule";
// Wrong
import { myFunction } from "../utils/myModule";
```

### Issue: Async tests timing out

**Solution**: Increase timeout in setup.ts or specific test

```typescript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Mocks not resetting between tests

**Solution**: Use `jest.clearAllMocks()` in `beforeEach`

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Ensure the following:

1. All environment variables are mocked in `setup.ts`
2. No external API calls are made (all mocked)
3. No database connections required (Prisma is mocked)
4. Tests are deterministic and don't depend on timing

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all edge cases are covered
3. Maintain test coverage above 80%
4. Update this README if adding new test categories
