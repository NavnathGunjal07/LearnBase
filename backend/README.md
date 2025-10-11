# LearnBase Backend - Node.js TypeScript

Modern backend API built with Node.js, TypeScript, Express, and Prisma.

## Tech Stack

- **Node.js** - Runtime environment
- **TypeScript** - Type safety
- **Express** - Web framework
- **Prisma** - ORM for database
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## Features

- ✅ JWT Authentication
- ✅ User Management
- ✅ Topics & Subtopics CRUD
- ✅ Progress Tracking
- ✅ Type-safe with TypeScript
- ✅ Database migrations with Prisma
- ✅ Input validation
- ✅ Error handling

## Setup

### 1. Install Dependencies

```bash
cd backend-ts
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/learnbase"
JWT_SECRET="your-super-secret-key"
PORT=8000
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Run the Server

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `GET /api/users` - Get all users (requires auth)
- `GET /api/users/:userId` - Get user by ID (requires auth)
- `PATCH /api/users/me` - Update current user (requires auth)
- `DELETE /api/users/me` - Delete current user (requires auth)

### Topics
- `GET /api/topics` - Get all topics with progress (requires auth)
- `GET /api/topics/:topicId` - Get topic by ID (requires auth)
- `POST /api/topics` - Create topic (requires auth)
- `PATCH /api/topics/:topicId` - Update topic (requires auth)
- `DELETE /api/topics/:topicId` - Delete topic (requires auth)
- `POST /api/topics/:topicId/subtopics` - Create subtopic (requires auth)
- `GET /api/topics/:topicId/subtopics` - Get subtopics (requires auth)

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <your-token>
```

## Project Structure

```
backend-ts/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── routes/
│   │   ├── auth.ts         # Auth endpoints
│   │   ├── users.ts        # User endpoints
│   │   └── topics.ts       # Topic endpoints
│   ├── utils/
│   │   ├── auth.ts         # Auth utilities
│   │   ├── prisma.ts       # Prisma client
│   │   └── validators.ts   # Input validators
│   └── index.ts            # Main server file
├── package.json
├── tsconfig.json
└── .env
```

## Database Models

- **User** - User accounts
- **Topic** - Learning topics
- **Subtopic** - Topic subdivisions
- **Exercise** - Coding exercises
- **TestCase** - Exercise test cases
- **Submission** - User submissions
- **Progress** - User progress
- **ChatSession** - Learning sessions
- **ChatMessage** - Chat messages
- **Badge** - Achievements
- **UserBadge** - User achievements
- **AILog** - AI interaction logs

## Development

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

### Type Generation

Prisma automatically generates types. After schema changes:

```bash
npm run prisma:generate
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database
3. Set strong `JWT_SECRET`
4. Enable HTTPS
5. Configure proper CORS origins
6. Run migrations: `npm run prisma:migrate`
7. Build: `npm run build`
8. Start: `npm start`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio GUI

## License

MIT
