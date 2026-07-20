# Campus Complaint Management System

A mini project for managing student complaints on campus.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: JSON file (backend/data/db.json)
- Auth: Sessions + hashed passwords (bcrypt)

## Roles
- **Student** — register, log in, submit complaints, track status
- **Staff** — view assigned complaints, update status, add remarks
- **Admin** — dashboard stats, assign complaints to staff, create staff accounts

## How to Run
1. `cd backend`
2. `npm install`
3. `npm start`
4. Open `http://localhost:3000`

Default admin login (auto-created on first run):
- Username: `admin`
- Password: `admin123`

## Status
🚧 In progress — student flow (register/login/submit complaints) is working.
Staff and admin dashboards are being built next.