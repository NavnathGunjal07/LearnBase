# API Services

This folder contains all API service modules organized by domain.

## Structure

```
api/
├── axiosInstance.ts          # Configured axios instance with interceptors
├── index.ts                  # Main export file
├── services/
│   ├── auth.service.ts       # Authentication endpoints
│   ├── user.service.ts       # User profile endpoints
│   ├── chat.service.ts       # Chat/messaging endpoints
│   ├── topic.service.ts      # Topic management endpoints
│   ├── execute.service.ts    # Code execution endpoints
│   └── index.ts              # Services export file
└── README.md                 # This file
```

## Usage

### Import Services

```typescript
// Import specific service
import { authService, userService } from '@/api';

// Or import everything
import * as api from '@/api';
```

### Example: Login

```typescript
import { authService } from '@/api';

const handleLogin = async (email: string, password: string) => {
  try {
    const { user, token } = await authService.login({ email, password });
    localStorage.setItem('token', token);
    console.log('Logged in:', user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Example: Get Chat History

```typescript
import { chatService } from '@/api';

const loadHistory = async (topicId: number, subtopicId?: number) => {
  try {
    const { sessionId, messages } = await chatService.getChatHistory(topicId, subtopicId);
    console.log('Chat history:', messages);
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};
```

## Features

### Axios Instance (`axiosInstance.ts`)

- **Base URL**: Automatically configured from environment variables
- **Auth Token**: Automatically adds Bearer token from localStorage
- **Request Logging**: Logs API calls in development mode
- **Error Handling**: Global error interceptor with toast notifications
- **Auto Redirect**: Redirects to login on 401 errors

### Error Handling

All API calls automatically handle errors through the axios interceptor:
- **400**: Invalid request - shows validation errors
- **401**: Unauthorized - redirects to login
- **403**: Forbidden - shows permission error
- **404**: Not found - shows resource not found
- **500**: Server error - shows generic server error
- **Network errors**: Shows connection error

### Type Safety

All services are fully typed with TypeScript interfaces for:
- Request parameters
- Response data
- Error responses

## Adding New Services

1. Create a new service file in `services/` folder
2. Import `axiosInstance`
3. Define TypeScript interfaces for requests/responses
4. Export service object with methods
5. Add export to `services/index.ts`

Example:

```typescript
// services/example.service.ts
import axiosInstance from '../axiosInstance';

export interface ExampleData {
  id: string;
  name: string;
}

export const exampleService = {
  async getExample(id: string): Promise<ExampleData> {
    const response = await axiosInstance.get<ExampleData>(`/example/${id}`);
    return response.data;
  },
};
```

## Environment Variables

Set the API base URL in your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

If not set, defaults to `http://localhost:8080/api`.
