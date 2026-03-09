## Cracker Store – MERN E‑Commerce (Fireworks)

Full‑stack MERN app for selling crackers (fireworks), with JWT auth, cart, orders, and an admin panel.

### Project structure

- **backend**: Node.js + Express + MongoDB (Mongoose)
  - Models: `User`, `Product`, `Cart`, `Order`
  - Auth: JWT (user + admin)
  - Features: product listing/details, search, category filter, cart, place order, admin product CRUD, admin order management, image upload
- **frontend**: React (Vite) + React Router + Axios
  - Pages: Home, Products, Product Details, Cart (with checkout), Login, Register, Order History, Admin Dashboard

### Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas URI

### Backend setup

1. Go to backend folder and install deps:

   ```bash
   cd backend
   npm install
   ```

2. Create `.env` from the example and adjust as needed:

   ```bash
   cp .env.example .env
   # On Windows (PowerShell):
   # copy .env.example .env
   ```

   Key variables:

   - **`MONGO_URI`** – your MongoDB connection string  
   - **`JWT_SECRET`** – random secret for JWT  
   - **`ADMIN_EMAIL` / `ADMIN_PASSWORD`** – initial admin user for seeding

3. Seed initial data (admin user + sample products):

   ```bash
   npm run seed
   ```

4. Start the backend API:

   ```bash
   npm run dev
   ```

   - Server runs on `http://localhost:5000`
   - REST base path: `/api/...`
   - Product images are served from `/uploads/...`

### Backend API overview

- **Auth**
  - `POST /api/auth/register` – register user → `{ token, user }`
  - `POST /api/auth/login` – login → `{ token, user }`
  - `GET /api/auth/me` – current user (requires `Authorization: Bearer <token>`)

- **Products**
  - `GET /api/products` – list products  
    - Query params: `category`, `search`, `featured=true`
  - `GET /api/products/:id` – product details
  - `POST /api/products` – **admin**, create product (supports `multipart/form-data` with `image`)
  - `PUT /api/products/:id` – **admin**, update product (also supports new `image`)
  - `DELETE /api/products/:id` – **admin**, delete product

- **Cart** (requires user token)
  - `GET /api/cart` – get current user cart
  - `POST /api/cart/add` – add/update cart item `{ productId, qty }`
  - `DELETE /api/cart/item/:productId` – remove item
  - `DELETE /api/cart/clear` – clear cart

- **Orders** (requires user token)
  - `POST /api/orders` – place order from cart  
    body: `{ shippingAddress, paymentMethod }`
  - `GET /api/orders/my` – current user orders
  - `GET /api/orders/:id` – specific order for that user

- **Admin**
  - `GET /api/admin/orders` – list all orders
  - `PUT /api/admin/orders/:id/status` – update order status (`Placed | Packed | Shipped | Delivered | Cancelled`)

### Frontend setup

1. Go to frontend folder and install deps:

   ```bash
   cd frontend
   npm install
   ```

2. Start the React app:

   ```bash
   npm run dev
   ```

   - Vite dev server runs on `http://localhost:5173`
   - Proxy forwards `/api` and `/uploads` to `http://localhost:5000`

### Frontend pages & features

- **Home**
  - Hero section with call‑to‑action
  - Category shortcuts (Sparklers, Rockets, Flower Pots, Bombs, Gift Boxes)
  - Featured products (`GET /api/products?featured=true`)

- **Products**
  - Product list with **search** (by name/description) and **category filter**
  - Each product links to its **details page**

- **Product Details**
  - Product info (image, name, category, price, description, stock)
  - Add to cart (requires login)

- **Cart + Checkout**
  - View items, quantities, and subtotals
  - Simple **shipping address form**
  - Place order (COD) → `POST /api/orders` and cart cleared

- **Auth**
  - **Login** and **Register** pages using JWT
  - Auth state stored in localStorage and provided via `AuthContext`

- **Order History**
  - Lists user’s orders with items, totals, and **status tracking**

- **Admin Dashboard**
  - Protects access to admin users only
  - **Product management**: add, update, delete (with image upload)
  - **Order management**: view all orders and update status

### How to log in as admin

1. Run backend seed script (`npm run seed` in `backend`).
2. Login on the frontend using the seeded admin credentials from `.env`  
   (default: `admin@crackerstore.local` / `Admin@12345` if unchanged).
3. Access the Admin panel via the **Admin** link in the navbar.

