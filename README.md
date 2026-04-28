# Payroll Management System

A production-ready payroll management system for manpower businesses managing 500+ employees. The application includes Excel-based salary uploads, employee and salary storage in PostgreSQL, and on-demand salary slip PDF generation.

## Tech Stack

- Frontend: React + Vite + Axios
- Backend: Node.js + Express
- Database: PostgreSQL with Supabase-compatible SQL
- PDF Generation: PDFKit
- Excel Parsing: `xlsx`

## Project Structure

```text
.
|-- backend
|-- frontend
|-- database
`-- samples
```

## Core Features

### Admin Panel

- Admin login with JWT authentication
- Upload salary data from `.xlsx`
- Parse and validate rows
- Upsert employee records
- Insert or update monthly salary records
- Return upload log with success and failure counts
- View recent upload history

### Employee Portal

- Search using employee code and month
- View salary breakdown
- Download salary slip PDF

### Security

- JWT-based protection for admin APIs
- Express rate limiting
- Input validation with `express-validator`
- Parameterized PostgreSQL queries to prevent SQL injection
- Basic security headers with Helmet

## Excel Format

Required columns:

`EmployeeCode | Name | Basic | HRA | Allowances | Deductions | NetSalary | Month`

Accepted month formats:

- `YYYY-MM`
- `Month YYYY`

Optional extra columns supported during upload:

- `Department`
- `Designation`
- `BankDetails`

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:5000`.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

Backend environment template:

- [backend/.env.example](C:/Users/kuppa/OneDrive/Music/Documents/New%20project/backend/.env.example)

Important backend auth variables:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

Database configuration options:

- Preferred: set `DATABASE_URL` to the full PostgreSQL/Supabase URI
- Easier manual option: set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
- `DB_SSL=true` is recommended for hosted databases such as Supabase and Render

Frontend environment template:

- [frontend/.env.example](C:/Users/kuppa/OneDrive/Music/Documents/New%20project/frontend/.env.example)

## API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/upload-salary`
- `GET /api/upload-logs`
- `GET /api/employee/:code`
- `GET /api/salary/:code/:month`
- `GET /api/salary-slip/:code/:month`
- `GET /api/health`

Use `YYYY-MM` for the salary routes, for example `2026-03`.

`/api/upload-salary` and `/api/upload-logs` require an admin bearer token.

## Database Setup on Supabase

Run the SQL file in Supabase SQL Editor:

- [database/schema.sql](C:/Users/kuppa/OneDrive/Music/Documents/New%20project/database/schema.sql)

## Sample Data

- CSV preview: [samples/sample-salary-data.csv](C:/Users/kuppa/OneDrive/Music/Documents/New%20project/samples/sample-salary-data.csv)
- XLSX generator: [samples/generate-sample-xlsx.js](C:/Users/kuppa/OneDrive/Music/Documents/New%20project/samples/generate-sample-xlsx.js)

Generate a sample `.xlsx` file after backend dependencies are installed:

```bash
cd backend
node ..\samples\generate-sample-xlsx.js
```

This creates `samples/sample-salary-data.xlsx`.

## Deployment

### Backend on Render

1. Push the project to GitHub.
2. Create a new Render Web Service.
3. Set the root directory to `backend`.
4. Build command: `npm install` or `npm run build`
5. Start command: `npm start`
6. Add all backend environment variables.
7. Set either:
   - `DATABASE_URL` to the exact full connection string copied from Supabase `Connect`, or
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_SSL=true`
8. Set `FRONTEND_URL` to your deployed Vercel URL.

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Add `VITE_API_BASE_URL` with your Render backend URL plus `/api`.
4. Deploy.

### Database on Supabase

1. Create a Supabase project.
2. Open the SQL editor.
3. Run [database/schema.sql](C:/Users/kuppa/OneDrive/Music/Documents/New%20project/database/schema.sql).
4. Copy the exact connection string from `Connect`.
5. If you enter values manually instead of using `DATABASE_URL`, prefer the `Session pooler` host plus `DB_SSL=true`.

## Notes

- Salary records are unique per employee per payroll month.
- Employee codes are normalized to uppercase.
- PDF slips are generated on demand and streamed from the backend.
