# StockDrive IMS — API Summary Reference

Interactive Swagger/OpenAPI documentation is available live at `http://localhost:5000/api/docs`.

All endpoints are versioned under `/api/v1` and follow a consistent JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "limit": 10, "total": 45, "totalPages": 5, "hasNext": true, "hasPrev": false }
}
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| **GET** | `/health` | Public | System liveness probe |
| **GET** | `/api/docs` | Public | Interactive Swagger UI Documentation |
| **POST** | `/api/v1/auth/register` | Public (Rate-limited) | Register customer account |
| **POST** | `/api/v1/auth/login` | Public (Rate-limited) | Authenticate user & issue tokens |
| **POST** | `/api/v1/auth/refresh` | Public | Silent refresh via `stockdrive_rt` cookie |
| **POST** | `/api/v1/auth/logout` | Authenticated | Revoke refresh token & clear cookie |
| **GET** | `/api/v1/auth/me` | Authenticated | Get current logged-in user profile |
| **GET** | `/api/v1/products` | Public | List paginated products (filters, search, sort) |
| **GET** | `/api/v1/products/:id` | Public | Get product details by ID |
| **GET** | `/api/v1/products/categories` | Public | List all accessory categories |
| **GET** | `/api/v1/products/brands` | Public | Distinct list of accessory brands |
| **POST** | `/api/v1/products` | Admin | Create product with initial stock |
| **PUT** | `/api/v1/products/:id` | Admin | Update product details & price |
| **DELETE** | `/api/v1/products/:id` | Admin | Soft-delete product (`isActive = false`) |
| **POST** | `/api/v1/products/upload` | Admin | Upload image file via Multer |
| **POST** | `/api/v1/orders` | Customer | Transactional checkout with atomic stock decrement |
| **GET** | `/api/v1/orders` | Authenticated | List customer orders or admin order table |
| **GET** | `/api/v1/orders/:id` | Authenticated | Get order details & status timeline |
| **PATCH** | `/api/v1/orders/:id/status` | Admin | Update status (cancelling restocks items) |
| **POST** | `/api/v1/orders/:id/cancel` | Customer | Cancel pending/processing order (restocks items) |
| **POST** | `/api/v1/stock/adjust` | Admin | Stock IN, OUT, or ADJUSTMENT with reason |
| **GET** | `/api/v1/stock/ledger` | Admin | Filterable movement ledger |
| **GET** | `/api/v1/stock/alerts` | Admin | Low-stock products list (`stock <= reorderLevel`) |
| **GET** | `/api/v1/reports/kpis` | Admin | Revenue, orders, units sold, low-stock count |
| **GET** | `/api/v1/reports/revenue` | Admin | Revenue aggregation over time (daily/monthly) |
| **GET** | `/api/v1/reports/top-sellers` | Admin | Top selling products by units sold |
| **GET** | `/api/v1/reports/category-stock` | Admin | Inventory valuation by category |
| **GET** | `/api/v1/reports/export/orders` | Admin | Download Orders CSV |
| **GET** | `/api/v1/reports/export/stock` | Admin | Download Stock Movement Ledger CSV |
| **GET** | `/api/v1/reports/export/low-stock` | Admin | Download Low-Stock Alert CSV |
