# GraphQL Blog API - Production-Ready Implementation

A high-performance GraphQL API for a blog platform featuring advanced optimization patterns, secure JWT authentication, field-level authorization, and real-time subscriptions via WebSockets.

## Overview

This project demonstrates production-grade API development practices:

- **N+1 Query Prevention**: DataLoader pattern for batching database queries
- **Security**: JWT-based authentication with field-level authorization
- **Real-time Updates**: GraphQL subscriptions over WebSockets
- **Scalability**: Cursor-based pagination for efficient data retrieval
- **Container-Ready**: Fully dockerized with PostgreSQL & Redis

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Client (Browser/Mobile/API)             │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    HTTP/REST  GraphQL    WebSocket
    (unused)    /graphql   /graphql
        │          │          │
        └──────────┼──────────┘
                   │
        ┌──────────▼──────────┐
        │   Apollo Server     │
        │  (Express.js)       │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌────▼───┐
    │         │          │        │
    │ Loaders │          │PubSub  │
    │         │          │        │
    └────┬────┘          └────────┘
         │
    ┌────┴────────────┐
    │                 │
┌───▼──┐         ┌───▼──┐
│  DB  │         │Redis │
│(Pg)  │         │      │
└──────┘         └──────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 16+ (for local development)

### Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Database automatically seeded with test data
# API available at http://localhost:4000/graphql
# WebSocket at ws://localhost:4000/graphql
```

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start PostgreSQL & Redis (Docker)
docker-compose up -d db redis

# Start the application
npm start
```

## API Documentation

### Endpoints

| Method | Endpoint          | Purpose                     |
| ------ | ----------------- | --------------------------- |
| POST   | `/graphql`        | GraphQL queries & mutations |
| GET    | `/graphql`        | Apollo Playground IDE       |
| GET    | `/graphql/schema` | GraphQL SDL schema          |
| WS     | `/graphql`        | Subscriptions               |
| GET    | `/health`         | Health check                |

### Authentication

All protected operations require a JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## GraphQL Schema

### Types

```graphql
type User {
  id: ID!
  username: String!
  email: String! # Protected field
  role: String! # "user" or "admin"
  createdAt: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User! # Optimized with DataLoader
  published: Boolean!
  createdAt: String!
  updatedAt: String!
  comments(first: Int, after: String): CommentConnection!
}

type Comment {
  id: ID!
  content: String!
  author: User! # Optimized with DataLoader
  post: Post!
  createdAt: String!
}
```

### Queries

#### Get Single User

```graphql
query {
  user(id: "1") {
    id
    username
    email # Returns null if not authorized
  }
}
```

#### Get Paginated Users

```graphql
query {
  users(first: 10, after: "cursor_string") {
    edges {
      cursor
      node {
        id
        username
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Get Single Post

```graphql
query {
  post(id: "1") {
    title
    content
    author {
      username
    }
  }
}
```

#### Get Paginated Posts (Optimized)

```graphql
query {
  posts(first: 5, published: true) {
    edges {
      node {
        id
        title
        author {
          username
        } # Single batched query for all authors
        comments(first: 3) {
          # Single batched query for all comments
          edges {
            node {
              content
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Get Current User

```graphql
query {
  me {
    id
    email
    username
  }
}
# Requires: Authorization: Bearer <token>
# Returns: null + error if token missing/invalid
```

### Mutations

#### Create Post

```graphql
mutation {
  createPost(input: { title: "My Post", content: "...", published: true }) {
    id
    title
    createdAt
  }
}
# Requires: Authorization: Bearer <token>
```

#### Update Post

```graphql
mutation {
  updatePost(id: "1", input: { title: "Updated" }) {
    id
    title
  }
}
# Requires: Authorization: Bearer <token>
# Only post author or admin can update
```

#### Delete Post

```graphql
mutation {
  deletePost(id: "1") # Returns boolean
}
# Requires: Authorization: Bearer <token>
# Only post author or admin can delete
```

#### Create Comment

```graphql
mutation {
  createComment(input: { postId: "1", content: "Great post!" }) {
    id
    content
    createdAt
  }
}
# Requires: Authorization: Bearer <token>
```

### Subscriptions

#### Subscribe to New Posts

```graphql
subscription {
  postCreated {
    id
    title
    author {
      username
    }
  }
}
# WebSocket connection required
# Receives all new posts in real-time
```

#### Subscribe to Comments on Specific Post

```graphql
subscription {
  commentAdded(postId: "1") {
    id
    content
    author {
      username
    }
    createdAt
  }
}
# WebSocket connection required
# Receives new comments only for postId: "1"
```

## Security Features

### Field-Level Authorization

The `User.email` field is protected with the following rules:

```javascript
// User can view their own email
user.email  // ✅ Allowed

// Admin can view any email
admin.user(id: 2).email  // ✅ Allowed

// Regular user cannot view another user's email
user.user(id: 2).email  // ❌ Throws authorization error
```

**Seeded Users:**

- `user1`: Regular user (ID: 1)
- `user2`: Regular user (ID: 2)
- `admin`: Admin user (ID: 3)

### JWT Implementation

- **Algorithm**: HS256
- **Payload**: `{ sub: userId, role: userRole, iat: timestamp }`
- **Expiry**: 1 hour (configurable)
- **Secret**: `JWT_SECRET` environment variable

```bash
# Get JWT for seeded user
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ login(username: \"user1\", password: \"password123\") }"
  }'
```

## ⚡ Performance Optimization

### DataLoader Pattern

**Problem**: N+1 Query Anti-pattern

```
Query: Get 100 posts with their authors
Naive approach: 1 query (posts) + 100 queries (each author)
Result: 101 database queries ❌
```

**Solution**: DataLoader Batching

```
Query: Get 100 posts with their authors
DataLoader approach: 1 query (posts) + 1 query (authors in batch)
Result: 2 database queries ✅
```

**Verification**: Enable SQL logging in the application to see batched queries:

```bash
# In docker container, you'll see:
SELECT id, username, email FROM users WHERE id = ANY($1);
# Instead of 100 individual SELECT queries
```

### Cursor-Based Pagination

Opaque cursors (Base64 encoded) prevent issues with real-time data:

```javascript
// First page
{ posts(first: 10) { pageInfo { endCursor } } }

// Next page - cursor-based, safe even if new posts added
{ posts(first: 10, after: "Y3Vyc29yXzEwMA==") { ... } }
```

## Testing

### Test Queries (Paste in Apollo Playground)

#### 1. Authentication Flow

```graphql
# Step 1: Register
mutation {
  register(
    username: "testuser"
    email: "test@example.com"
    password: "pass123"
  ) {
    id
    token
  }
}

# Step 2: Login
mutation {
  login(username: "testuser", password: "pass123") {
    id
    token
  }
}

# Step 3: Use token in Authorization header and query:
query {
  me {
    id
    username
  }
}
```

#### 2. Authorization Test

```graphql
# As user1, try to view user2's email (should fail)
query {
  user(id: 2) {
    id
    email # Returns null + error
  }
}

# As admin, try to view user2's email (should succeed)
query {
  user(id: 2) {
    id
    email # Returns email
  }
}
```

#### 3. N+1 Optimization Verification

```graphql
# Monitor SQL logs while running this query
# Should see 2-3 queries total (not N+1)
query {
  posts(first: 10) {
    edges {
      node {
        id
        title
        author {
          username
        } # Batched query
        comments(first: 5) {
          # Batched query
          edges {
            node {
              content
              author {
                username
              } # Batched query
            }
          }
        }
      }
    }
  }
}
```

#### 4. Subscriptions Test

**Terminal 1** - Subscribe to new posts:

```bash
wscat -c ws://localhost:4000/graphql

# Then send:
{"type":"start","payload":{"query":"subscription { postCreated { id title } }"}}
```

**Terminal 2** - Create a post:

```graphql
mutation {
  createPost(
    input: { title: "Broadcast Test", content: "Testing subscriptions" }
  ) {
    id
  }
}
```

**Expected**: Terminal 1 receives the new post data in real-time ✅

### Scripts

**Check database seeding:**

```bash
docker-compose exec db psql -U user -d blogdb -c "SELECT * FROM users;"
```

**View application logs:**

```bash
docker-compose logs -f app
```

**SQL Query Logging:**
Check logs for `[SQL]` prefix to see all queries executed.

## Project Structure

```
.
├── src/
│   ├── index.js              # Server entry point
│   ├── schema.js             # GraphQL schema
│   ├── resolvers.js          # Query/Mutation resolvers
│   ├── subscriptionResolvers.js # Subscription resolvers
│   ├── auth.js               # JWT utilities
│   ├── loaders.js            # DataLoader instances
│   ├── db.js                 # Database connection
│   ├── pubsub.js             # Publish/Subscribe system
│   ├── middleware.js         # Express middleware
│   ├── cache.js              # Redis caching
│   └── ...other utilities
├── seeds/
│   ├── 01-schema.sql         # Database schema
│   └── 02-data.sql           # Test data
├── tests/
│   └── integration.test.js    # Test suite
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # Application container
├── .env.example              # Environment template
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🛠️ Environment Variables

See `.env.example` for all variables:

```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/blogdb

# Server
PORT=4000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRY=1h

# Cache
REDIS_URL=redis://redis:6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Posts Table

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Comments Table

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  post_id INTEGER NOT NULL REFERENCES posts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Troubleshooting

**Port 4000 already in use:**

```bash
lsof -i :4000
kill -9 <PID>
```

**Database connection refused:**

```bash
docker-compose logs db
# Verify DATABASE_URL in .env matches docker-compose.yml
```

**GraphQL playground not loading:**

```bash
# Ensure Apollo Server is running
curl http://localhost:4000/health
```

**Subscriptions not working:**

```bash
# Verify WebSocket URL: ws://localhost:4000/graphql
# Check Redis is running: docker-compose logs redis
```

**JWT token expired:**

- Default expiry: 1 hour
- Set `JWT_EXPIRY` in `.env` to change
- Re-login to get new token

## License

Copyright © 2026. All rights reserved.
