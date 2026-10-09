# StockDrive IMS — System Architecture Documentation

StockDrive IMS is a production-grade Inventory Management System and Storefront for automotive accessories, built using the modern MERN stack with strict TypeScript, layered architecture, and transactional integrity.

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    Client["React 18 + Vite Frontend\n(Tailwind CSS + Zustand + TanStack Query)"]
    Gateway["Express 4/5 API Layer\n(Helmet, CORS Whitelist, Rate Limiter)"]
    AuthMW["Auth Middleware\n(JWT Access Token 15m + Cookie Refresh 7d)"]
    ZodMW["Zod Request Validator\n(Body, Query, Params)"]
    Controllers["Express Controllers\n(HTTP Parsing & Response Formatting)"]
    Services["Business Logic Services\n(Rules, Calculations, Snapshots)"]
    Models["Mongoose Models & Schemas\n(Text/Compound Indexes, Strict Types)"]
    MongoDB[("MongoDB 7.0 Replica Set\n(Atomic Transactions & Pipelines)")]

    Client -->|REST API Requests| Gateway
    Gateway --> AuthMW
    AuthMW --> ZodMW
    ZodMW --> Controllers
    Controllers --> Services
    Services --> Models
    Models --> MongoDB
```

## 2. Layering Architecture

The backend strictly separates responsibilities into four distinct layers:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Admin
    participant Route as Express Router
    participant Validator as Zod Middleware
    participant Controller as Controller
    participant Service as Business Service
    participant Model as Mongoose Model
    participant DB as MongoDB Replica Set

    Customer->>Route: POST /api/v1/orders
    Route->>Validator: Validate Schema (Items, Address)
    Validator->>Controller: Validated Request
    Controller->>Service: OrderService.createOrder(userId, input)
    Note over Service: Enforces: Stock >= requested,<br/>Integer paise math,<br/>Transactional session
    Service->>Model: Atomic $inc decrement with bounds
    Model->>DB: Commit Transaction
    DB-->>Model: Success
    Model-->>Service: Order Document Snapshot
    Service-->>Controller: Return Domain Object
    Controller-->>Customer: Standard { success, data, error, meta }
```

## 3. Authentication & Silent Token Refresh Flow

- **Access Token:** Short-lived JWT (15 minutes), signed with `JWT_ACCESS_SECRET`, carrying user id, email, and role.
- **Refresh Token:** Long-lived JWT (7 days), stored in an `httpOnly`, `secure`, `sameSite` cookie.
- **Token Rotation:** Each refresh request invalidates the previous hashed token and issues a fresh pair. Replay attacks trigger immediate session revocation.

```mermaid
sequenceDiagram
    autonumber
    participant Browser as Browser Client
    participant Axios as Axios Interceptor
    participant Server as Express Server

    Browser->>Server: Request with Expired Access Token
    Server-->>Axios: 401 Unauthorized
    Note over Axios: Pauses failed queue
    Axios->>Server: POST /api/v1/auth/refresh (Cookie attached)
    Note over Server: Validates refresh token hash,<br/>Rotates token, sets new cookie
    Server-->>Axios: 200 OK + New Access Token
    Axios->>Server: Retries Original Request with New Bearer Token
    Server-->>Browser: 200 OK (Seamless to User)
```

## 4. Transactional Checkout & Restock Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Cart: Customer adds items (stock boundary validated)
    Cart --> Checkout: Proceed to checkout
    Checkout --> Transaction: Begin Transaction
    Transaction --> StockDeduction: Atomic $inc: -quantity ($gte check)
    StockDeduction --> OrderPlaced: Snapshot Name, Price, SKU
    OrderPlaced --> MovementOut: Log StockMovement (OUT)
    MovementOut --> [*]: Order PENDING

    OrderPlaced --> Cancelled: Customer/Admin cancels order
    Cancelled --> StockRestored: Atomic $inc: +quantity
    StockRestored --> MovementIn: Log StockMovement (IN)
```
