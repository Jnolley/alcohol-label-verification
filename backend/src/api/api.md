# API Layer

HTTP interface for the label verification system.

## Structure

```
api/
├── controllers/           # Request/response handlers
├── routes/               # Express route definitions
└── contracts/            # Request/response types
```

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Route as Express Router
    participant Multer as Multer Middleware
    participant Controller
    participant Manager as VerificationManager

    Client->>Route: POST /api/verify
    Note over Client,Route: multipart/form-data

    Route->>Multer: Process file upload
    Multer->>Route: Attach file to req.file

    Route->>Controller: verifyLabel(req, res)

    Controller->>Controller: Extract form data from req.body
    Controller->>Controller: Extract image buffer from req.file

    Controller->>Manager: processVerification(formData, buffer, filename)

    alt Success
        Manager->>Controller: VerificationResult
        Controller->>Client: 200 {success, message, fieldChecks}
    else HttpError
        Manager-->>Controller: throw HttpError
        Controller->>Client: {statusCode} {error: {code, message}}
    else Generic Error
        Manager-->>Controller: throw Error
        Controller->>Client: 500 {error: {code: 'INTERNAL_SERVER_ERROR'}}
    end
```

## Controller

**VerificationController** - Handles verification requests

**Responsibilities**:
- Extract form data from request
- Extract uploaded file
- Call VerificationManager
- Format response
- Handle errors

**Error Handling**:
- Catches all errors from manager
- Checks if HttpError (has statusCode)
- Returns appropriate HTTP status
- Formats error response consistently

## Routes

**POST /api/verify**
- Uses Multer for multipart/form-data
- Single file upload: `image` field
- Memory storage (no disk writes)
- Calls VerificationController.verifyLabel

**GET /health**
- Simple health check endpoint
- Returns `{status: 'ok'}`

## Contracts

Type definitions for API requests and responses.

See `contracts/` directory for:
- Request payload types
- Response payload types
- Validation schemas

## Configuration

Multer configuration:
- Storage: memory (buffer)
- Field name: `image`
- No file filtering (validation done by ImageValidator)