# StockDrive IMS — Car Accessories Inventory Management System

[![CI Pipeline](https://github.com/stockdrive/ims/actions/workflows/ci.yml/badge.svg)](https://github.com/stockdrive/ims/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**StockDrive IMS** is a production-quality, modern MERN (MongoDB, Express, React, Node.js) application designed for a Car Accessories business (tyres, batteries, audio/infotainment, lighting, seat covers, detailing products). Built with strict TypeScript, layered backend architecture, atomic transaction handling, and a modern responsive user interface.

---

## 🚀 Quickstart (Under 5 Commands)

```bash
# 1. Clone repository
git clone https://github.com/stockdrive/ims.git && cd ims

# 2. Install workspace dependencies
npm install

# 3. Configure environment variables
cp server/.env.example server/.env && cp client/.env.example client/.env

# 4. Seed database (creates admin, customer, 6 categories, 30 products, orders)
npm run seed

# 5. Start development servers concurrently (Backend: 5000, Frontend: 5173)
npm run dev
```

Visit the application at:
- **Storefront:** [http://localhost:5173](http://localhost:5173)
- **Admin Dashboard:** [http://localhost:5173/admin](http://localhost:5173/admin)
- **Swagger Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### Demo Accounts
| Role | Email | Password | Landing Route |
|---|---|---|---|
| **Admin** | `admin@stockdrive.com` | `Admin@123` | `/admin` |
| **Customer** | `customer@stockdrive.com` | `Customer@123` | `/` |

---

## 🛠 Tech Stack

### Backend (`/server`)
- **Runtime:** Node.js 20+, Express 4/5, TypeScript (strict)
- **Database:** MongoDB with Mongoose (schemas, compound indexes, text indexes, integer paise currency)
- **Authentication:** JWT access token (15 min) + silent refresh token in an `httpOnly` secure cookie with token rotation and sha256 hashing
- **Security:** `helmet`, `cors` (whitelist), `express-rate-limit`, `express-mongo-sanitize`, `compression`
- **Validation:** Zod schemas on every request body/query/params
- **Logging & Errors:** Pino + `pino-http`, centralized error middleware with consistent envelope `{ success, data, error, meta }`
- **Docs & Testing:** Swagger UI at `/api/docs`, Vitest, Supertest

### Frontend (`/client`)
- **Framework:** React 18 + Vite + TypeScript (strict)
- **Styling:** Tailwind CSS + dark mode toggle (deep navy `#0b192c` & energetic orange `#f97316`)
- **Routing:** React Router v6 (data routes, protected wrappers `RequireAuth`, `RequireRole`)
- **State Management:** TanStack Query (server state), Zustand (persistent cart and auth state)
- **Forms & Tables:** React Hook Form + Zod resolver, TanStack Table
- **Charts & UI:** Recharts (Area/Bar charts), Lucide React, Cmd+K Command Palette, Printable Tax Invoice
- **Testing:** Vitest + React Testing Library, Playwright E2E

---

## 📦 Docker Deployment

Run the complete multi-container setup with MongoDB replica set support:

```bash
docker compose up --build
```
- MongoDB Replica Set on port `27017`
- Express API server on port `5000`
- Nginx React Client on port `3000`

---

## 🧪 Testing

```bash
# Run backend tests (unit & API tests)
npm run test:server

# Run frontend unit tests
npm run test:client

# Run Playwright E2E test flows
npm run test:e2e
```

---

## 📋 Role & Use Case Verification Checklist

| Role | Use Case | Route / Page | Implemented & Working |
|---|---|---|---|
| **Customer** | 1. Register (min 8 chars, uppercase, lowercase, numbers) | `/register` (`RegisterPage.tsx`) | ✅ |
| **Customer** | 2. Login / logout with silent refresh token rotation | `/login` (`LoginPage.tsx`, `/auth/refresh`) | ✅ |
| **Customer** | 3. View Products (search, categories, brands, price range, stock badges) | `/` (`CatalogPage.tsx`) | ✅ |
| **Customer** | 4. Purchase Accessories (cart, atomic decrement with transactions, mock payment) | `/cart` (`CartPage.tsx`, `OrderService.createOrder`) | ✅ |
| **Customer** | 5. Check Order Status (history, timeline, detail page, printable tax invoice) | `/orders`, `/orders/:id` (`OrderDetailPage.tsx`) | ✅ |
| **Admin** | 1. Login (redirect to `/admin`) | `/login` (auto role redirect to `/admin`) | ✅ |
| **Admin** | 2. Update Product (CRUD, SKU, price, stock, Multer image upload, soft delete) | `/admin/products` (`AdminProductsPage.tsx`) | ✅ |
| **Admin** | 3. Manage Stock (In / Out / Adjustment with mandatory reason, movement ledger, low-stock alerts) | `/admin/stock` (`AdminStockPage.tsx`, `StockService`) | ✅ |
| **Admin** | 4. View Orders (filterable table, detail drawer, status transitions, cancellation restocks automatically) | `/admin/orders` (`AdminOrdersPage.tsx`) | ✅ |
| **Admin** | 5. Generate Reports (dashboard KPIs, Recharts charts, CSV exports for orders, stock, low-stock) | `/admin`, `/admin/reports` (`ReportService`) | ✅ |

---

## 📚 Documentation Links
- [System Architecture & Mermaid Diagrams](file:///docs/architecture.md)
- [Database Schema & ER Diagram](file:///docs/er-diagram.md)
- [Complete REST API Endpoints Summary](file:///docs/api-summary.md)
