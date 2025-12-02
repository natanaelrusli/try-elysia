# Elysia with Bun runtime

## Getting Started
To get started with this template, simply paste this command into your terminal:
```bash
bun create elysia ./elysia-example
```

## Development
To start the development server run:
```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

Open http://localhost:8080/api/v1/openapi/ to see the OpenAPI documentation.

## Supabase Integration

This project supports Supabase as a database backend for the CMS. The system will automatically use Supabase if credentials are provided, otherwise it falls back to in-memory storage.

### Setup Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your credentials:**
   - Go to Project Settings > API
   - Copy your `Project URL` (SUPABASE_URL)
   - Copy your `anon/public` key (SUPABASE_ANON_KEY)

3. **Set environment variables:**
   ```bash
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   JWT_SECRET=your-jwt-secret
   ```

4. **Create the database schema:**
   - Open the Supabase SQL Editor
   - Run the SQL from `supabase-schema.sql` to create the required tables

5. **Install dependencies:**
   ```bash
   bun install
   ```

### Storage Backend

The CMS automatically selects the storage backend:
- **Supabase**: Used when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- **In-Memory**: Used as fallback when Supabase credentials are not available

### CMS API Endpoints

All CMS endpoints are prefixed with `/api/v1/cms/`:

- **Text Content**: `/cms/text`
- **Blog Posts**: `/cms/blog`
- **Page Configs**: `/cms/page-config`

See the OpenAPI documentation at http://localhost:8080/api/v1/openapi/ for detailed endpoint documentation.

## Authentication

This API uses Supabase Auth for authentication. Protected endpoints require a JWT token in the request headers.

### 1. Login to Get Token

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

### 2. Using the Token in Requests

Include the token in the `Authorization` header with the `Bearer` prefix:

**Format:**
```
Authorization: Bearer <your-token-here>
```

**Examples:**

#### Using cURL:
```bash
curl -X POST http://localhost:8080/api/v1/cms/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "key": "welcome-message",
    "content": "Welcome to our site!"
  }'
```

#### Using JavaScript/Fetch:
```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

const response = await fetch("http://localhost:8080/api/v1/cms/text", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({
    key: "welcome-message",
    content: "Welcome to our site!"
  })
});

const data = await response.json();
```

#### Using Axios:
```javascript
import axios from 'axios';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

const response = await axios.post(
  "http://localhost:8080/api/v1/cms/text",
  {
    key: "welcome-message",
    content: "Welcome to our site!"
  },
  {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  }
);
```

#### Using Postman/Insomnia:
1. Set the request method (GET, POST, etc.)
2. Go to the **Headers** tab
3. Add a new header:
   - **Key:** `Authorization`
   - **Value:** `Bearer <your-token-here>`

### 3. Get Current User

**Endpoint:** `GET /api/v1/auth/me`

```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <your-token-here>"
```

### 4. Refresh Token

When your access token expires, use the refresh token to get a new one:

**Endpoint:** `POST /api/v1/auth/refresh`

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

### Protected vs Public Endpoints

- **Public (No token required):**
  - `GET /api/v1/cms/text` - List all text content
  - `GET /api/v1/cms/text/:id` - Get text content by ID
  - `GET /api/v1/cms/blog` - List blog posts
  - `GET /api/v1/cms/blog/:id` - Get blog post by ID
  - `GET /api/v1/cms/page-config` - List page configs

- **Protected (Token required):**
  - `POST /api/v1/cms/*` - Create operations
  - `PUT /api/v1/cms/*` - Update operations
  - `DELETE /api/v1/cms/*` - Delete operations
  - `GET /api/v1/auth/me` - Get current user

### Creating Users

Users must be created in the Supabase Dashboard:

1. Go to your Supabase project
2. Navigate to **Authentication** > **Users**
3. Click **Add User** or **Invite User**
4. Enter email and password
5. User can now login via `/api/v1/auth/login`