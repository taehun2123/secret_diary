# Secret Diary API Specification

## Overview
This document describes the RESTful API for the Secret Diary application. The API provides endpoints for user authentication, diary management, and sticker customization.

**Base URL**: `/api`
**Version**: 1.0.0
**Authentication**: JWT-based (Bearer Token)

---

## Table of Contents
1. [Authentication](#authentication)
2. [Diary Entries](#diary-entries)
3. [Stickers](#stickers)
4. [Data Models](#data-models)
5. [Error Responses](#error-responses)

---

## Authentication

### POST /api/auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "password": "string"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid password
- `400 Bad Request`: Missing or invalid request body

---

### POST /api/auth/verify
Verify if the current token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token

---

## Diary Entries

### GET /api/diaries
Get all diary entries for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of entries to return (default: 50)
- `offset` (optional): Number of entries to skip (default: 0)
- `category` (optional): Filter by category

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "category": "string",
      "date": "YYYY.MM.DD",
      "music": "spotify:uri | null",
      "coverStickers": [
        {
          "id": "number",
          "src": "string",
          "x": "number",
          "y": "number"
        }
      ],
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "total": "number",
  "limit": "number",
  "offset": "number"
}
```

---

### GET /api/diaries/:id
Get a specific diary entry by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Diary entry ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "category": "string",
    "date": "YYYY.MM.DD",
    "music": "spotify:uri | null",
    "coverStickers": [...],
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `404 Not Found`: Diary entry not found
- `403 Forbidden`: Not authorized to access this entry

---

### POST /api/diaries
Create a new diary entry.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "string (required, max 200 chars)",
  "content": "string (required, max 10000 chars)",
  "category": "string (required, max 50 chars)",
  "date": "YYYY.MM.DD (optional, defaults to current date)",
  "music": "spotify:uri | null (optional)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "category": "string",
    "date": "YYYY.MM.DD",
    "music": "spotify:uri | null",
    "coverStickers": [],
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or missing required fields
- `413 Payload Too Large`: Content exceeds maximum length

---

### PUT /api/diaries/:id
Update an existing diary entry.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: Diary entry ID

**Request Body:**
```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "category": "string (optional)",
  "music": "spotify:uri | null (optional)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "category": "string",
    "date": "YYYY.MM.DD",
    "music": "spotify:uri | null",
    "coverStickers": [...],
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `404 Not Found`: Diary entry not found
- `403 Forbidden`: Not authorized to update this entry
- `400 Bad Request`: Invalid request body

---

### DELETE /api/diaries/:id
Delete a diary entry.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Diary entry ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Diary entry deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Diary entry not found
- `403 Forbidden`: Not authorized to delete this entry

---

## Stickers

### PUT /api/diaries/:id/stickers
Update stickers for a diary cover.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: Diary entry ID

**Request Body:**
```json
{
  "stickers": [
    {
      "id": "number (required)",
      "src": "string (required, max 500 chars)",
      "x": "number (required, 0-100)",
      "y": "number (required, 0-100)"
    }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "coverStickers": [...]
  }
}
```

**Error Responses:**
- `404 Not Found`: Diary entry not found
- `403 Forbidden`: Not authorized to update this entry
- `400 Bad Request`: Invalid sticker data

---

## Data Models

### DiaryEntry
```typescript
interface DiaryEntry {
  id: string;                    // Unique identifier
  userId: string;                 // Owner's user ID
  title: string;                  // Entry title (max 200 chars)
  content: string;                // Entry content (max 10000 chars)
  category: string;               // Category name (max 50 chars)
  date: string;                   // Display date (YYYY.MM.DD format)
  music: string | null;           // Spotify URI or null
  coverStickers: Sticker[];       // Array of stickers
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
}
```

### Sticker
```typescript
interface Sticker {
  id: number;                     // Sticker identifier
  src: string;                    // Image source URL/path
  x: number;                      // X position (percentage, 0-100)
  y: number;                      // Y position (percentage, 0-100)
}
```

### User
```typescript
interface User {
  id: string;                     // Unique user identifier
  passwordHash: string;           // Hashed password (bcrypt)
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
}
```

---

## Error Responses

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes:
- `UNAUTHORIZED`: Authentication required or invalid token
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid request parameters
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes:
- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Not authorized
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: Request body too large
- `500 Internal Server Error`: Server error

---

## Implementation Notes

### Authentication
- JWT tokens expire after 7 days
- Tokens should be stored securely on the client (httpOnly cookie recommended)
- Password must be hashed using bcrypt with salt rounds >= 10

### Data Persistence
- Use JSON file storage for MVP (can migrate to database later)
- File path: `data/diaries.json` and `data/users.json`
- Ensure proper file locking for concurrent access

### Security Considerations
1. All endpoints except `/api/auth/login` require authentication
2. Users can only access their own diary entries
3. Input validation on all endpoints
4. Sanitize user input to prevent XSS
5. Rate limiting on authentication endpoints (max 5 attempts per minute)

### Future Enhancements
1. Pagination improvements (cursor-based)
2. Search and filtering by date range
3. Categories management endpoint
4. Image upload for custom stickers
5. Backup/export functionality
6. Multi-user support with user registration
