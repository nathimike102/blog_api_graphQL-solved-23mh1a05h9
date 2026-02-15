# Render + Neon Setup Guide

**Architecture:**

- **Web App:** Render (blog-api) - Free tier Node.js
- **PostgreSQL:** Neon (free tier, no database limit)
- **Redis:** Render (blog-redis) - Free tier

## Step 1: Deploy Web Service via Render Blueprint ✓

Blueprint will create: `blog-api` (Node.js service)

## Step 2: Create PostgreSQL Database on Neon

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up (free - no credit card needed)
3. Create a new project:
   - **Name:** `blog-api` or `graphql`
   - **Plan:** Free tier
4. Note the connection string (Neon will give you the full `postgres://` URL)

## Step 3: Create Redis Instance on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Redis"**
3. Configure:
   - **Name:** `blog-redis`
   - **Plan:** Free
   - **Region:** Oregon
4. Copy the Redis connection string

## Step 4: Update Web Service Environment Variables

1. Go to **blog-api** service on Render
2. Click **"Settings"** → **"Environment"**
3. Update these variables:
   - **DATABASE_URL:** Paste the Neon PostgreSQL connection string from Step 2
   - **REDIS_URL:** Paste the Redis connection string from Step 3
   - Keep others as generated

4. Click **"Save"** - this will auto-redeploy

## Step 5: Initialize Database

Wait 3-5 minutes for the service to redeploy, then seed the database:

```bash
# Using the Neon connection string from Step 2
psql "YOUR_NEON_DATABASE_URL" < seeds/01-schema.sql
psql "YOUR_NEON_DATABASE_URL" < seeds/02-data.sql
```

Or via Neon Console:

1. Go to [Neon Dashboard](https://console.neon.tech)
2. Select your database
3. Go to **"SQL Editor"**
4. Paste content of `seeds/01-schema.sql`
5. Execute, then paste content of `seeds/02-data.sql`

## Step 6: Test Your API

```bash
# Health check
curl https://YOUR-BLOG-API.onrender.com/health
# Should return: {"status":"ok"}

# Test GraphQL
curl -X POST https://YOUR-BLOG-API.onrender.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{users(first:1){edges{node{username}}}}"}'
```

## Step 7: Test Authentication

```bash
# Login
curl -X POST https://YOUR-BLOG-API.onrender.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ login(username: \"user1\", password: \"password123\") }"}'

# Use the returned token
curl -X POST https://YOUR-BLOG-API.onrender.com/graphql \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"query":"{ me { id username email } }"}'
```

## Done! 🎉

Your GraphQL API is now live with:

- ✅ Neon PostgreSQL (unlimited free databases)
- ✅ Render Redis for subscriptions
- ✅ Render Node.js application
- ✅ Auto-HTTPS everywhere
- ✅ 100% free tier!
