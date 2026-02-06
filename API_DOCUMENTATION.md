# API Documentation

## Base URL
```
http://your-domain.com/api
```

## Authentication
This API uses Laravel Sanctum for authentication. Include the Bearer token in the Authorization header for protected routes.

```
Authorization: Bearer {your-token}
```

## Endpoints

### Authentication

#### Register
```
POST /auth/register
```

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890",
    "business_name": "John's Business"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {...},
        "token": "your-api-token"
    }
}
```

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {...},
        "token": "your-api-token"
    }
}
```

#### Get User Info
```
GET /auth/user
Authorization: Bearer {token}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer {token}
```

### Orders

#### Create Order
```
POST /orders
Authorization: Bearer {token}
```

**Request Body:**
```json
{
    "network_id": 1,
    "size": "1GB",
    "beneficiary_number": "0241234567"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Order created successfully",
    "data": {
        "order": {
            "id": 1,
            "user_id": 1,
            "total": "5.00",
            "status": "processing",
            "beneficiary_number": "0241234567",
            "network": "MTN",
            "created_at": "2024-01-01T00:00:00.000000Z"
        },
        "transaction": {
            "id": 1,
            "order_id": 1,
            "user_id": 1,
            "amount": "5.00",
            "status": "completed",
            "type": "order",
            "reference": "API-1-1704067200"
        }
    }
}
```

#### Get Orders
```
GET /orders
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "data": [...],
        "current_page": 1,
        "total": 10
    }
}
```

#### Get Single Order
```
GET /orders/{id}
Authorization: Bearer {token}
```

### Products

#### Get Available Products
```
GET /products
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "MTN 1GB Data",
            "price": "5.00",
            "network": "MTN",
            "product_type": "data",
            "description": "1GB data bundle for MTN"
        }
    ]
}
```

## Error Responses

All error responses follow this format:
```json
{
    "success": false,
    "message": "Error description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 422: Validation Error
- 500: Server Error