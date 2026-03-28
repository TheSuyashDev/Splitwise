# Splitwise Clone – Expense Sharing Web Application

A full-stack expense sharing app built with **React**, **Node.js/Express**, and **MySQL**.

## Features

- **User Authentication** – Register, login with JWT
- **Group Management** – Create groups, add/remove members by email
- **Expense Tracking** – Add expenses, split equally among participants
- **Balance Calculation** – Real-time net balances (who owes whom)
- **Debt Settlement** – Record settlements between users

## Tech Stack

| Layer      | Technology         |
|------------|-------------------|
| Frontend   | React + Vite      |
| Backend    | Node.js + Express |
| Database   | MySQL             |
| Auth       | JWT + bcrypt      |

## Prerequisites

- **Node.js** v18+
- **MySQL** server running locally
- **npm**

## Setup

### 1. Database

Open MySQL and run the schema:

```sql
source d:/Projects/splitwise/backend/schema.sql
```

Or import it via MySQL Workbench / phpMyAdmin.

### 2. Backend

```bash
cd backend
```

Edit `.env` and set your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=splitwise_db
JWT_SECRET=splitwise_super_secret_key_2024
PORT=5000
```

Install and start:

```bash
npm install
npm start
```

Server will run on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App will run on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint                        | Description             | Auth |
|--------|---------------------------------|-------------------------|------|
| POST   | `/api/register`                 | Register user           | No   |
| POST   | `/api/login`                    | Login user              | No   |
| GET    | `/api/groups`                   | List user's groups      | Yes  |
| POST   | `/api/groups`                   | Create group            | Yes  |
| GET    | `/api/groups/:id`               | Group details + members | Yes  |
| POST   | `/api/groups/:id/members`       | Add member by email     | Yes  |
| DELETE | `/api/groups/:id/members/:uid`  | Remove member           | Yes  |
| POST   | `/api/expenses`                 | Add expense             | Yes  |
| GET    | `/api/expenses/:groupId`        | List group expenses     | Yes  |
| GET    | `/api/balances/:groupId`        | Get group balances      | Yes  |
| POST   | `/api/settle`                   | Record settlement       | Yes  |
| GET    | `/api/settle/:groupId`          | List group settlements  | Yes  |

## Project Structure

```
splitwise/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── controllers/          # Business logic
│   ├── middleware/auth.js    # JWT middleware
│   ├── routes/               # API routes
│   ├── schema.sql            # Database schema
│   ├── server.js             # Express entry point
│   └── .env                  # Environment variables
│
└── frontend/
    └── src/
        ├── components/       # Navbar, ProtectedRoute
        ├── context/          # AuthContext
        ├── pages/            # Login, Register, Dashboard, GroupDetails
        ├── services/api.js   # Axios API client
        ├── App.jsx           # Router setup
        └── index.css         # Design system
```
