# SAKINA

**SAKINA** is an e-commerce store specializing in carefully selected natural stones. The project provides a calm, simple, and elegant shopping experience focused on product quality and ease of use. Users can explore a curated collection of stones, view detailed product information, add items to their shopping bag, and complete their orders through a clear checkout process.

The store combines a peaceful, spiritual visual identity with a modern and responsive shopping experience that works smoothly on both desktop and mobile devices. The application also supports both Arabic and English languages.

## Key Features

The project includes a branded home page, a collection page for browsing products, and detailed pages for each stone containing its name, description, image, product type, and price. It also provides an interactive shopping bag where users can update quantities, review their order total, and calculate shipping costs.

Customers can choose to receive a stone as an individual piece or have it prepared as a tasbih. The checkout process supports guest orders, allowing users to submit their contact information, delivery address, and additional notes without creating an account. The store currently supports cash on delivery as a payment method.

After placing an order, customers are redirected to an order confirmation page containing a unique reference number. The project also includes an owner dashboard for managing orders, filtering them by status or date range, updating their status, and exporting visible orders to an Excel file.

## Technologies Used

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | CSS, Responsive Design, Light Theme |
| State Management | React Context for cart, language, and theme management |
| Routing | Wouter |
| Client–Server Communication | tRPC |
| Database | MySQL with Drizzle ORM |
| Authentication | OAuth |
| Testing | Vitest and Testing Library |
| Package Manager | pnpm |

## Project Structure

The project contains several main routes, including the home page, product collection, stone details, checkout, order confirmation, certificate guide, and owner order dashboard.

The product catalog, pricing logic, and shared types are organized inside the `shared` directory. The `server` directory contains the backend routers, order management logic, database configuration, and storage utilities. The frontend pages and reusable interface components are located inside `client/src`.

## Project Goal

SAKINA aims to provide an elegant and user-friendly online store for natural stone products. The project focuses on creating a calm and trustworthy customer journey, starting with product discovery and ending with order confirmation and organized order management.

## Running the Project Locally

Install the project dependencies using:

```bash
pnpm install
```

Start the development server with:

```bash
pnpm dev
```

Run the test suite with:

```bash
pnpm test
```

Build the project for production with:

```bash
pnpm build
```

Start the production server with:

```bash
pnpm start
```

## Deployment

This full-stack application (Node.js/Express + React Vite + tRPC) can be deployed easily on:

### Option 1: GitHub Pages (Automated via GitHub Actions)
The repository includes a automated GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. In your GitHub repository settings, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to the `main` branch will automatically test, build, and deploy the store to:
   `https://radwasengr.github.io/SAKINA-NaturalStones/`

### Option 2: Render.com (Full-Stack with Express Backend)
1. Go to [Render.com](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository: `https://github.com/RadwaSengr/SAKINA-NaturalStones`.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (any random secure string)
   - `OWNER_OPEN_ID`: `sakina_owner_admin`
   - *(Optional)* `DATABASE_URL`: MySQL connection URL (if omitted, uses local persistent storage).

### Option 3: Railway.app (Full-Stack)
1. Go to [Railway.app](https://railway.app) and create a **New Project** from GitHub.
2. Select `RadwaSengr/SAKINA-NaturalStones`.
3. Railway automatically detects the project and starts it.



