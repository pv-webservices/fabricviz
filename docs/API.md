# FabricViz AI — API Specification

> **Base URL (local):** `http://localhost:4000`
> **Base URL (prod):** `https://api.yourdomain.com`

All responses follow the standard envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

---

## Health

### `GET /health`

Check API readiness.

**Auth:** None

**Response `200`**
```json
{ "status": "ok", "timestamp": "2026-06-17T18:00:00.000Z" }
```

---

## Authentication

### `POST /api/auth/verify-code`

Validate a 5-digit customer access code and issue a JWT session.

**Auth:** None

**Request Body**
```json
{
  "code": "AB123",
  "rememberDevice": true,
  "deviceFingerprint": "optional-device-id"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | `string` | ✅ | Exactly 5 alphanumeric characters |
| `rememberDevice` | `boolean` | ❌ | Default `false`. When `true` with a `deviceFingerprint`, reuses existing sessions. |
| `deviceFingerprint` | `string` | ❌ | Stable device identifier for remember-device |

**Response `200` — Success**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "sessionId": "uuid",
    "customer": {
      "code": "AB123",
      "name": "Meera Sharma",
      "company": "Decor Studio"
    }
  }
}
```

**Response `401` — Invalid Code**
```json
{
  "success": false,
  "error": { "code": "INVALID_CODE", "message": "Access code not found" }
}
```

**Response `403` — Inactive Code**
```json
{
  "success": false,
  "error": { "code": "CODE_INACTIVE", "message": "This access code has been deactivated" }
}
```

**Response `400` — Validation Error**
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Access code must be exactly 5 characters" }
}
```

---

### `POST /api/auth/admin-login`

Authenticate an admin/staff user with email and password.

**Auth:** None

**Request Body**
```json
{
  "email": "admin@fabricviz.com",
  "password": "s3cret"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | `string` | ✅ | Valid email address |
| `password` | `string` | ✅ | Non-empty |

**Response `200` — Success**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "admin@fabricviz.com",
      "role": "super_admin",
      "name": "Admin User"
    }
  }
}
```

**Response `401` — Invalid Credentials**
```json
{
  "success": false,
  "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" }
}
```

---

### `GET /api/auth/me`

Return the current authenticated user or customer profile.

**Auth:** `Authorization: Bearer <token>`

**Response `200` — Customer**
```json
{
  "success": true,
  "data": {
    "type": "customer",
    "code": "AB123",
    "sessionId": "uuid",
    "name": "Meera Sharma",
    "company": "Decor Studio"
  }
}
```

**Response `200` — Admin**
```json
{
  "success": true,
  "data": {
    "type": "admin",
    "userId": "uuid",
    "email": "admin@fabricviz.com",
    "role": "super_admin"
  }
}
```

**Response `401` — Unauthorized**
```json
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired token" }
}
```

---

### `POST /api/auth/logout`

Invalidate the current session. For customers, deletes the session row from `customer_sessions`.

**Auth:** `Authorization: Bearer <token>`

**Request Body (optional)**
```json
{
  "sessionId": "uuid"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `sessionId` | `string` (UUID) | ❌ | If omitted, uses the session from the JWT |

**Response `200` — Success**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

## JWT Token Details

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Expiry | Configurable via `JWT_EXPIRY` env var (default `7d`) |
| Customer secret | `JWT_SECRET` env var |
| Admin secret | `JWT_SECRET` env var (same key, differentiated by `type` claim) |

### Customer Token Payload
```json
{
  "type": "customer",
  "accessCodeId": "uuid",
  "sessionId": "uuid",
  "code": "AB123",
  "customerName": "Meera Sharma"
}
```

### Admin Token Payload
```json
{
  "type": "admin",
  "userId": "uuid",
  "email": "admin@fabricviz.com",
  "role": "super_admin"
}
```

---

## Database Migrations (Sprint 1)

No schema changes required — Sprint 0's `init.sql` already contains:
- `users` table with `password_hash` column
- `access_codes` table with `code` and `active` columns
- `customer_sessions` table with `token_hash`, `device_fingerprint`, and `expires_at`
- `audit_logs` table for login/logout tracking

---

## Collections (Sprint 2)

### `GET /api/collections`

List collections with optional filters and pagination.

**Auth:** None (public)

**Query Parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `endUse` | `string` | — | Filter: `sofa\|curtain\|rug\|wallpaper\|both` |
| `active` | `boolean` | — | Filter by active status |
| `search` | `string` | — | ILIKE search on name |
| `page` | `number` | 1 | Page number |
| `limit` | `number` | 20 | Items per page (max 100) |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [{ "id": "uuid", "name": "...", "end_use": "sofa", ... }],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

---

### `GET /api/collections/:id`

Get a single collection with its fabric count.

**Auth:** None

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid", "name": "Summer Sofa", "description": "...",
    "thumbnail_url": "...", "end_use": "sofa", "active": true,
    "display_order": 0, "fabricCount": 24, ...
  }
}
```

---

### `POST /api/collections`

Create a new collection.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "name": "Summer Collection",
  "description": "Lightweight summer fabrics",
  "thumbnailUrl": "https://...",
  "groupId": "uuid",
  "endUse": "sofa",
  "qrCode": "SC2026",
  "qrUrl": "https://...",
  "active": true,
  "displayOrder": 1
}
```

**Response `201`** — Full collection row

---

### `PUT /api/collections/:id`

Update a collection. Only provided fields are changed.

**Auth:** Admin Bearer JWT

**Request Body** — Any subset of create fields

**Response `200`** — Updated collection row

---

### `DELETE /api/collections/:id`

Soft-delete (set `active = false`).

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{ "success": true, "data": { "message": "Collection deactivated" } }
```

---

## Fabrics (Sprint 2)

### `GET /api/fabrics`

List fabrics with multi-filter and pagination.

**Auth:** None (public)

**Query Parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `collectionId` | `uuid` | — | Filter by collection |
| `endUse` | `string` | — | sofa\|curtain\|rug\|wallpaper\|both |
| `colorFamily` | `string` | — | Exact match |
| `quality` | `string` | — | Exact match |
| `search` | `string` | — | ILIKE on name OR code |
| `tags` | `string` | — | Comma-separated, uses array overlap |
| `active` | `boolean` | — | Filter by active status |
| `page` | `number` | 1 | |
| `limit` | `number` | 20 | Max 100 |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "uuid", "collection_id": "uuid", "name": "Velvet Royal",
      "code": "VR-001", "color_family": "Blue", "quality": "Premium",
      "tags": ["velvet","luxury"], "end_use": "sofa",
      "repeat_width_mm": 64, "repeat_height_mm": 64,
      "fabric_width_cm": 140, "price_inr": 2500,
      "feature_flags": { "highMartindale": true, "fadeResistant": true },
      "active": true, ...
    }],
    "total": 150, "page": 1, "limit": 20
  }
}
```

---

### `GET /api/fabrics/:id`

Get a single fabric.

**Auth:** None

**Response `200`** — Full fabric row

---

### `POST /api/fabrics`

Create a new fabric.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "collectionId": "uuid",
  "name": "Velvet Royal",
  "code": "VR-001",
  "swatchUrl": "https://...",
  "textureUrl": "https://...",
  "colorFamily": "Blue",
  "quality": "Premium",
  "tags": ["velvet", "luxury"],
  "endUse": "sofa",
  "repeatWidthMm": 64,
  "repeatHeightMm": 64,
  "fabricWidthCm": 140,
  "priceInr": 2500,
  "featureFlags": {
    "highMartindale": true,
    "fadeResistant": true,
    "waterRepellent": false,
    "stainRepellent": false,
    "antimicrobial": false,
    "premiumQuality": true
  },
  "active": true
}
```

**Response `201`** — Full fabric row

---

### `PUT /api/fabrics/:id`

Update a fabric. Only provided fields are changed.

**Auth:** Admin Bearer JWT

**Response `200`** — Updated fabric row

---

### `DELETE /api/fabrics/:id`

Soft-delete (set `active = false`).

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{ "success": true, "data": { "message": "Fabric deactivated" } }
```

---

### `POST /api/fabrics/import`

Bulk import fabrics from a JSON array.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "fabrics": [
    {
      "collectionId": "uuid",
      "name": "Fabric A",
      "code": "FA-001",
      "endUse": "sofa",
      "colorFamily": "Red",
      "priceInr": 1500
    },
    {
      "collectionId": "uuid",
      "name": "Fabric B",
      "code": "FB-002",
      "endUse": "curtain"
    }
  ]
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "errors": []
  }
}
```

**Response with partial failures:**
```json
{
  "success": true,
  "data": {
    "imported": 1,
    "errors": ["Row 2 (FB-002): duplicate key value violates unique constraint"]
  }
}
```

---

## Predefined Rooms (Sprint 2)

### `GET /api/rooms`

List predefined rooms. When filtering by `endUse`, rooms with `end_use = 'both'` are always included.

**Auth:** None (public)

**Query Parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `endUse` | `string` | — | `sofa\|curtain\|both` |
| `active` | `boolean` | — | Filter by active status |
| `search` | `string` | — | ILIKE on name |
| `page` | `number` | 1 | |
| `limit` | `number` | 20 | Max 100 |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "uuid", "name": "Modern Living Room",
      "image_url": "...", "thumbnail_url": "...",
      "end_use": "both", "display_order": 0, "active": true, ...
    }],
    "total": 8, "page": 1, "limit": 20
  }
}
```

---

### `GET /api/rooms/:id`

Get a single room.

**Auth:** None

**Response `200`** — Full room row

---

### `POST /api/rooms`

Create a new predefined room.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "name": "Modern Living Room",
  "imageUrl": "https://storage.example.com/rooms/modern-living.jpg",
  "thumbnailUrl": "https://storage.example.com/rooms/modern-living-thumb.jpg",
  "endUse": "both",
  "displayOrder": 1,
  "active": true
}
```

**Response `201`** — Full room row

---

### `PUT /api/rooms/:id`

Update a room. Only provided fields are changed.

**Auth:** Admin Bearer JWT

**Response `200`** — Updated room row

---

### `DELETE /api/rooms/:id`

Soft-delete (set `active = false`).

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{ "success": true, "data": { "message": "Room deactivated" } }
```

---

## QR & Analytics (Sprint 3)

### `GET /api/qr/:code`

Resolve a QR code string back to a collection.

**Auth:** None (public)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "type": "collection",
    "collectionId": "uuid",
    "name": "Summer Sofa",
    "endUse": "sofa"
  }
}
```

---

### `POST /api/analytics/track`

Track a customer or system event.

**Auth:** Bearer JWT (Customer or Admin)

**Request Body**
```json
{
  "eventName": "fabric_viewed",
  "fabricId": "uuid",
  "collectionId": "uuid",
  "visualizationId": "uuid",
  "metadata": { "duration_seconds": 45 }
}
```

**Response `201`**
```json
{ "success": true, "data": { "message": "Event tracked successfully" } }
```

---

### `GET /api/analytics/summary`

Get high-level dashboard metrics.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{
  "success": true,
  "data": {
    "totalVisualizations": 1500,
    "totalAccessCodes": 250,
    "totalEvents": 14500
  }
}
```

---

## Access Codes (Sprint 3)

### `GET /api/access-codes`

List access codes with filters.

**Auth:** Admin Bearer JWT

**Query Parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `active` | `boolean` | — | Filter by active status |
| `search` | `string` | — | ILIKE on customer, company, or code |
| `page` | `number` | 1 | |
| `limit` | `number` | 20 | |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "uuid", "code": "ABC12", "customer_name": "John Doe",
      "company_name": "Design Co", "phone": "1234567890",
      "active": true, "render_count": 5, "credit_limit": 100,
      "credits_used": 5, "created_at": "...", "last_used_at": "..."
    }],
    "total": 45, "page": 1, "limit": 20
  }
}
```

---

### `GET /api/access-codes/:id`

Get single access code.

**Auth:** Admin Bearer JWT

**Response `200`** — Full row

---

### `POST /api/access-codes`

Create access code.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "code": "XYZ99", // Optional: Auto-generates 5 chars if omitted
  "customerName": "Jane Smith",
  "companyName": "Interior Labs",
  "phone": "0987654321",
  "creditLimit": 50,
  "active": true
}
```

**Response `201`** — Full row

---

### `PUT /api/access-codes/:id`

Update access code (partial).

**Auth:** Admin Bearer JWT

**Response `200`** — Full row

---

### `DELETE /api/access-codes/:id`

Soft delete access code.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{ "success": true, "data": { "message": "Access code deactivated" } }
```

---

## Customer Requests (Sprint 3)

### `POST /api/requests`

Submit a request (quote, sample, or access code).

**Auth:** None (public customer endpoint)

**Request Body**
```json
{
  "type": "sample_request", // 'access_code_request' | 'quote_request' | 'sample_request'
  "name": "Alex",
  "company": "Studio",
  "email": "alex@example.com",
  "phone": "555-0100",
  "fabricId": "uuid",
  "message": "Please send a sample of the Velvet Royal"
}
```

**Response `201`** — Full row with `status: 'pending'`

---

### `GET /api/requests`

List incoming requests.

**Auth:** Admin Bearer JWT

**Query Parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `type` | `string` | — | Filter by request type |
| `status` | `string` | — | `pending\|approved\|rejected` |
| `search` | `string` | — | ILIKE on name, company, email |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [{ ... }],
    "total": 12, "page": 1, "limit": 20
  }
}
```

---

### `PUT /api/requests/:id/status`

Approve or reject a request.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "status": "approved" // 'pending' | 'approved' | 'rejected'
}
```

**Response `200`** — Updated row, tracking `handled_by`

---

## Render Orchestration (Sprint 4)

### `POST /api/renders`

Enqueue an asynchronous render job using Nano Banana.

**Auth:** Bearer JWT (Customer or Admin)

**Request Body**
```json
{
  "fabricId": "uuid",
  "roomId": "uuid", // Required if no uploadedPhotoUrl
  "uploadedPhotoUrl": "https://...", // Required if no roomId
  "objectType": "sofa", // 'sofa' | 'curtain' | 'rug' | 'wallpaper'
  "sourceType": "predefined_room" // 'template' | 'predefined_room' | 'upload' | 'camera'
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid", // Use this to poll status
    "visualizationId": "uuid"
  }
}
```

---

### `GET /api/renders/:jobId/status`

Poll the status of an ongoing render job. It is recommended to poll every 3 seconds.

**Auth:** Bearer JWT (Customer or Admin)

**Response `200` (Pending/Processing)**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "visualizationId": "uuid",
    "jobStatus": "processing", // 'queued' | 'processing' | 'completed' | 'failed' | 'retrying'
    "visualizationStatus": "processing", // 'pending' | 'processing' | 'completed' | 'failed'
    "attemptCount": 1,
    "errorMessage": null,
    "beforeUrl": null,
    "afterUrl": null,
    "pdfUrl": null,
    "startedAt": "2026-06-17T...",
    "completedAt": null
  }
}
```

**Response `200` (Completed)**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "visualizationId": "uuid",
    "jobStatus": "completed",
    "visualizationStatus": "completed",
    "attemptCount": 1,
    "errorMessage": null,
    "beforeUrl": "https://storage.example.com/rooms/living-room.jpg",
    "afterUrl": "https://storage.example.com/renders/rendered-sofa.jpg",
    "pdfUrl": null,
    "completedAt": "2026-06-17T..."
  }
}
```

---

## Storage & History (Sprint 5)

### `POST /api/uploads`

Upload a customer photo for visualizing.

**Auth:** Bearer JWT (Customer or Admin)

**Request**
`multipart/form-data`
- `file`: The image file (JPEG/PNG, max 10MB).

**Response `201`**
```json
{
  "success": true,
  "data": { "url": "https://storage.example.com/uploads/..." }
}
```

---

### `GET /api/history`

List past visualizations.

**Auth:** Bearer JWT (Customer or Admin)
- Customers only see their own visualizations linked to their `accessCodeId`.
- Admins see all.

**Query Parameters**
| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | `number` | 1 | |
| `limit` | `number` | 20 | |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "uuid",
      "object_type": "sofa",
      "status": "completed",
      "before_url": "...",
      "after_url": "...",
      "pdf_url": "...",
      "created_at": "...",
      "fabric_name": "Velvet",
      "fabric_thumbnail": "...",
      "room_name": "Living Room"
    }],
    "total": 45, "page": 1, "limit": 20
  }
}
```

---

### `GET /api/history/:id`

View a specific visualization history item.

**Auth:** Bearer JWT (Customer or Admin)

**Response `200`** — Full row with joined fabric and room details.

---

### `DELETE /api/history/:id`

Soft delete a visualization.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{ "success": true, "data": { "message": "History item removed" } }
```

---

### `GET /api/downloads/:id/image`

Download or redirect to the finalized render image.

**Auth:** Bearer JWT (Customer or Admin)

**Response `302`** — Redirects to the `after_url` object storage URL.

---

### `GET /api/downloads/:id/pdf`

Generate (if missing) and download a PDF brief for the visualization.

**Auth:** Bearer JWT (Customer or Admin)

**Response `302`** — Redirects to the generated `pdf_url` object storage URL.

---

### `GET /api/storage/snapshots`

Get aggregated historical storage usage statistics.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "snapshot_date": "2026-06-17", "total_bytes": 10485760, "total_files": 45 }
  ]
}
```

---

## Operations & Results (Sprint 6)

### `GET /api/results/:id`

Get a rich visualization result payload, specifically formatted for the Customer Result Page.

**Auth:** Bearer JWT (Customer or Admin)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "objectType": "sofa",
    "sourceType": "predefined_room",
    "beforeUrl": "...",
    "afterUrl": "...",
    "pdfUrl": "...",
    "createdAt": "...",
    "fabricSnapshot": {
      "name": "Velvet Royal",
      "collectionName": "Summer Col.",
      "colorFamily": "Blue",
      "endUse": "sofa",
      "thumbnailUrl": "..."
    },
    "roomName": "Living Room"
  }
}
```

---

### `GET /api/customers`

Admin dashboard for monitoring customer usage.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "A1B2C",
      "customer_name": "Jane",
      "company_name": "Studio J",
      "phone": "555-0100",
      "active": true,
      "render_count": 45,
      "credit_limit": 100,
      "credits_used": 45,
      "created_at": "...",
      "last_used_at": "...",
      "history_count": "12"
    }
  ]
}
```

---

### `GET /api/storage/dashboard`

Admin storage dashboard, including quota warnings.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{
  "success": true,
  "data": {
    "systemTotals": {
      "totalBytes": 104857600,
      "totalFiles": 150
    },
    "historicalSnapshots": [ ... ],
    "nearingLimitCustomers": [
      {
        "id": "uuid",
        "customer_name": "Jane",
        "company_name": "Studio J",
        "credits_used": 95,
        "credit_limit": 100,
        "percentage_used": 95.0
      }
    ]
  }
}
```

---

### `GET /api/analytics/dashboard`

Rich analytics dashboard aggregating system activity.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{
  "success": true,
  "data": {
    "totalVisualizations": 1500,
    "activeUsers": 25,
    "totalEvents": 4500,
    "renderStatusCounts": {
      "completed": 1400,
      "failed": 25,
      "processing": 75
    },
    "topFabrics": [
      { "name": "Velvet Royal", "count": 450 }
    ],
    ]
  }
}
```

---

## Administration (Sprint 7)

### `PATCH /api/requests/:id`

Approve or reject a request. If it is a `credit_request` and is approved, the system automatically grants the credits.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "status": "approved", // 'pending' | 'approved' | 'rejected'
  "adminNotes": "Approved for 100 pilot credits"
}
```

**Response `200`**
```json
{ "success": true, "data": { "id": "uuid", "status": "approved", ... } }
```

---

### `GET /api/credits/:accessCodeId/history`

Get the audit trail of credit allocations for a specific customer.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "access_code_id": "uuid",
      "amount": 100,
      "reason": "Credit Request Approved",
      "created_by": "uuid",
      "created_at": "..."
    }
  ]
}
```

---

### `POST /api/credits/:accessCodeId/grant`

Manually grant (or deduct via negative numbers) credits.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "amount": 50,
  "reason": "Pilot extension"
}
```

**Response `200`**
```json
{ "success": true, "data": { "message": "Credits updated successfully" } }
```

---

### `GET /api/settings`

Get global platform configuration (site name, limits, URLs).

**Auth:** Public (or Bearer JWT)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "site_name": "FabricViz AI",
    "history_limit": "50",
    "storage_mode": "cloud"
  }
}
```

---

### `PATCH /api/settings`

Bulk update global settings.

**Auth:** Admin Bearer JWT

**Request Body**
```json
{
  "site_name": "FabricViz Pro",
  "support_whatsapp": "+1234567890"
}
```

**Response `200`**
```json
{ "success": true, "data": { "message": "Settings updated successfully" } }
```

---

### `DELETE /api/storage/cleanup`

Run a garbage collection routine that permanently deletes deactivated (soft-deleted) visualizations and issues cloud storage removal commands.

**Auth:** Admin Bearer JWT

**Response `200`**
```json
{ "success": true, "data": { "message": "Cleanup successful", "deletedCount": 14 } }
```

