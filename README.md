# Aurixon - Intelligent Carbon Footprint Management

Aurixon is a state-of-the-art Carbon Footprint Management Platform designed for Small and Medium Enterprises (SMEs). It simplifies the complex process of tracking, calculating, and reporting greenhouse gas (GHG) emissions in compliance with international standards like **CSRD** and **GHG Protocol**.

With an intuitive dashboard, automated emission factor selection, and instant report generation, Aurixon empowers businesses to take control of their environmental impact.

---

## ✨ Key Features

### 📊 **Intelligent Dashboard**
- **Aggregated Insights**: View your total carbon footprint across all reporting periods.
- **Traffic Light System**: Instantly gauge your performance against industry baselines (Green/Yellow/Red).
- **Scope Breakdown**: Visualize emissions across Scope 1 (Direct), Scope 2 (Energy), and Scope 3 (Supply Chain).

### 📝 **Activity Management**
- **Comprehensive Coverage**: Track varied activities including fuel combustion, electricity, business travel, freight, and more.
- **Auto-Calculation**: Select your activity type and quantity; the system automatically applies the most accurate emission factors (EPA/EEA/DEFRA).
- **Smart Validation**: Ensures data integrity with real-time validation logic.

### 📄 **Reporting & Compliance**
- **CSRD & GHG Protocol**: Generate reports compliant with major regulatory frameworks.
- **Instant Export**: Download detailed PDF reports with charts, methodology explanations, and granular data tables.
- **Payment Integration**: Secure, pay-per-report model integrated with Stripe.

### 🏢 **Enterprise Ready**
- **Role-Based Access**: Manage permissions for Admins, Editors, and Viewers.
- **Multi-Entity Support**: Manage multiple reporting periods and boundaries.
- **Secure & Scalable**: Built on a robust Node.js/PostgreSQL architecture.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, TailwindCSS, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (with JSONB support for flexible metadata)
- **Payment**: Stripe API Integration
- **PDF Generation**: PDFKit

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development.

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

### 1. Database Setup

Aurixon relies on a robust PostgreSQL schema. All schema definitions and seed data are located in `backend/db/`.

1.  **Create Database**:
    Open your PostgreSQL client (e.g., pgAdmin, psql) and create a new database:
    ```sql
    CREATE DATABASE aurixon_db;
    ```

2.  **Configure Environment**:
    Navigate to the `backend` folder and configure your variables:
    ```bash
    cd backend
    cp .env.example .env
    ```
    Open `.env` and set your `DATABASE_URL`:
    ```env
    DATABASE_URL=postgresql://postgres:password@localhost:5432/aurixon_db
    ```

3.  **Run Migration Script**:
    We provide a utility script to initialize all tables and load seed data (emission factors, etc.):
    ```bash
    npm run db:setup
    ```
    *You should see "Database setup completed successfully!"*

### 2. Backend Server

1.  Navigate to the backend directory (if not already there):
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the server:
    ```bash
    npm start
    ```
    The server will run on `http://localhost:5001` (or your configured PORT).

### 3. Frontend Application

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    ```bash
    cp .env.example .env.local
    ```
    *Note: `.env.local` is git-ignored. Add your Stripe Public Key here if testing payments.*

4.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

---

## 🔒 Environment Configuration

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | API Server Port (default: 5001) |
| `DATABASE_URL` | PostgreSQL Connection String |
| `JWT_SECRET` | Secret key for signing Auth Tokens |
| `STRIPE_SECRET_KEY` | Secret key from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret for verifying Stripe events |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | URL of the backend API (e.g., `http://localhost:5001/api`) |
| `VITE_STRIPE_PUBLIC_KEY` | Publishable key from Stripe Dashboard |

---

## 🧪 Testing

To run the test suite (if configured):

```bash
cd backend
npm test
```

---

## 📝 License

This project is proprietary software. All rights reserved.
