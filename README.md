# Inventory & Billing Management System

A full-stack MERN application for managing products, stock, customers, and invoices with PDF generation and a live dashboard.

```
billing-system/
├── server/      # Node.js + Express + Mongoose API
└── client/      # React + Vite + Tailwind frontend
```

---

## Features

### Backend
- RESTful API with versioning (`/api/v1/...`)
- JWT auth with bcrypt password hashing
- Role-based access control (Admin / Staff)
- Mongoose models with indexes on SKU, invoice number, and frequently filtered fields
- Centralized error handling and consistent response envelope
- Input validation with `express-validator`
- MongoDB transactions for invoice + stock consistency
- PDF invoice generation with `pdfkit`
- CSV export for products and invoices
- Dashboard aggregations (sales trend, top products, sales by category)
- Seed script with admin, staff, categories, products, customers, sample invoices

### Frontend
- Responsive sidebar + topbar layout
- Login page with form validation (Zod + React Hook Form)
- Dashboard with stat cards and Recharts (line, bar, pie)
- Products, Categories, Customers, Stock Movements, Invoices, Users pages
- Reusable `DataTable`, `Modal`, `ConfirmDialog`, `SearchInput`, `FilterBar`, `StatCard`, `Spinner`
- Live invoice total calculation, add/remove items
- Invoice PDF preview, download, cancel, payment recording
- Dark mode toggle
- Toast notifications and loading/empty states

---

## Tech stack

- **Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs, express-validator, helmet, morgan, cors, pdfkit
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, React Hook Form + Zod, Recharts, react-hot-toast

---

## Prerequisites

- Node.js 18+
- MongoDB 5+ running locally or a MongoDB Atlas connection string
- npm

---

## Setup

### 1. Clone and install

```bash
# from the project root
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` in each folder and adjust as needed.

**`server/.env`**

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/billing_system

JWT_ACCESS_SECRET=replace_with_a_long_random_string
JWT_ACCESS_EXPIRES_IN=7d

SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin@12345
SEED_ADMIN_PHONE=0000000000
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Seed the database

```bash
cd server
npm run seed
```

This creates:

- **Admin** — `admin@example.com` / `Admin@12345`
- **Staff** — `staff@example.com` / `Staff@12345`
- 5 categories, 12 products, 3 customers, and 2 sample invoices

### 4. Run in development

```bash
# Terminal 1 — API
cd server
npm run dev

# Terminal 2 — Web
cd client
npm run dev
```

- API: http://localhost:5000
- Web: http://localhost:5173

Open the web app, sign in, and start managing products, customers, and invoices.

---

## Production build

```bash
cd client && npm run build
cd ../server && npm start
```

Serve the `client/dist` folder with any static host (or with `express.static`) and point `VITE_API_URL` at the API in production.

---

## REST API (v1)

All endpoints are prefixed with `/api/v1`. Authenticated routes require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Admin | Register a new user |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET  | `/auth/me` | Auth | Current user |

### Users (admin only)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/users` | List users (pagination, search) |
| GET | `/users/:id` | Get user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Categories

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/categories` | Auth | List categories |
| POST | `/categories` | Admin, Staff | Create |
| PUT | `/categories/:id` | Admin, Staff | Update |
| DELETE | `/categories/:id` | Admin | Delete |

### Products

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/products` | Auth | Paginated list (search, category, stockStatus, sort) |
| GET | `/products/all` | Auth | Full list (used by selectors) |
| GET | `/products/export.csv` | Auth | Download CSV |
| GET | `/products/:id` | Auth | Get |
| POST | `/products` | Admin, Staff | Create |
| PUT | `/products/:id` | Admin, Staff | Update |
| DELETE | `/products/:id` | Admin | Delete |

### Customers

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/customers` | Auth | Paginated list |
| GET | `/customers/:id` | Auth | Get |
| GET | `/customers/:id/history` | Auth | Invoice history |
| POST | `/customers` | Admin, Staff | Create |
| PUT | `/customers/:id` | Admin, Staff | Update |
| DELETE | `/customers/:id` | Admin | Delete |

### Stock

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/stock/movements` | Auth | List movements |
| POST | `/stock/adjust` | Admin, Staff | Manual IN / OUT / ADJUST |

### Invoices

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/invoices` | Auth | List (search, status, paymentStatus, from, to) |
| GET | `/invoices/export.csv` | Auth | Download CSV |
| POST | `/invoices` | Admin, Staff | Create (decrements stock atomically) |
| GET | `/invoices/:id` | Auth | Detail |
| GET | `/invoices/:id/pdf` | Auth | Inline PDF preview |
| GET | `/invoices/:id/download` | Auth | Force-download PDF |
| PATCH | `/invoices/:id/cancel` | Admin, Staff | Cancel & restore stock |
| PATCH | `/invoices/:id/payment` | Admin, Staff | Record payment |

### Dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard/summary` | Stat counters |
| GET | `/dashboard/sales-last-30-days` | Daily sales series |
| GET | `/dashboard/top-products` | Top 5 selling products |
| GET | `/dashboard/sales-by-category` | Pie data |
| GET | `/dashboard/recent-invoices` | Latest invoices |
| GET | `/dashboard/low-stock` | Low-stock list |
| GET | `/dashboard/all` | Everything in one call |

---

## Response envelope

Every response follows:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* payload */ }
}
```

Errors additionally include:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "details": [ { "field": "email", "message": "Invalid email" } ]
}
```

---

## Tests

```bash
cd server
npm test
```

The server is written as **ES modules** (`"type": "module"` in [server/package.json](file:///c:/Users/Acer/Documents/billing-system/server/package.json)). The test runner is invoked with `--experimental-vm-modules` so Jest can load `.js` files using ESM `import`/`export`.

Includes a Jest + Supertest smoke test covering auth (`/api/v1/auth/register`, `/auth/login`, `/auth/me`).

---

## Project layout

```
server/
├── src/
│   ├── config/         # db connection
│   ├── controllers/    # HTTP handlers
│   ├── middleware/     # auth, role, validation, error handler
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── services/       # business logic
│   ├── utils/          # ApiError, ApiResponse, pdf, csv, seed
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
└── package.json

client/
├── src/
│   ├── components/     # Sidebar, Topbar, Layout, DataTable, Modal, etc.
│   ├── context/        # AuthContext, ThemeContext
│   ├── lib/            # api client, utilities
│   ├── pages/          # Login, Dashboard, Products, Invoices, ...
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
└── package.json
```

---

## Notes

- All invoice operations use Mongoose transactions (`withTransaction`) to keep invoice, product stock, and stock movement records consistent.
- Cancelling an issued invoice restores the stock and logs an `IN` movement referencing the invoice.
- Insufficient stock is rejected at invoice creation time (HTTP 400).
- The frontend stores the JWT in `localStorage`; clear it on logout via the sidebar button.
- Set `NODE_ENV=production` to disable stack traces and `morgan` dev logs.