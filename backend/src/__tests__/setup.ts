// Test setup file
// This file runs before all tests

// Mock environment variables
process.env.JWT_SECRET = "test-secret-key-for-testing";
process.env.GROQ_API_KEY = "test-groq-api-key";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Increase timeout for async operations
jest.setTimeout(10000);
