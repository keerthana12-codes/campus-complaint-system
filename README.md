# Campus Complaint Management System

A mini project for managing student complaints on campus — students file
complaints, staff resolve them, and admins oversee the whole process.

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (no framework)
- **Backend:** Node.js + Express
- **Database:** A JSON file (`backend/data/db.json`) — kept simple for a
  mini project, no separate database server required
- **Auth:** Sessions (`express-session`) + hashed passwords (`bcryptjs`)

## Roles & Features

**Student**
- Register and log in
- File a new complaint (title, category, location, description)
- View status of their own complaints
- See remarks left by staff

**Staff**
- Log in (account created by admin)
- View complaints assigned to them, plus unassigned ones
- Update complaint status and add remarks

**Admin**
- Log in (default seeded account)
- Create staff accounts
- View all complaints
- Assign complaints to staff members

## Project Structure
campus-complaint-system/
├── backend/
│ ├── server.js # Express server + all API routes
│ ├── db.js # Tiny JSON-file database helper
│ ├── createStaff.js # One-off script to create a staff account via terminal
│ ├── package.json
│ └── data/db.json # Created automatically on first run (not committed)
└── frontend/
├── index.html # Login + student registration
├── student.html # Student dashboard
├── staff.html # Staff dashboard
├── admin.html # Admin dashboard
└── css/style.css # Shared styling for all pages

## How to Run

1. Install [Node.js](https://nodejs.org) if you don't have it
2. Install dependencies:
cd backend
npm install
3. Start the server:
npm start
4. Open your browser at **http://localhost:3000**

A default admin account is created automatically the first time you run
the server:
username: admin
password: admin123

## Demo Flow

1. Log in as **admin** (`admin` / `admin123`) → create a staff account
2. Log out → **register** a new student account → log in as that student
3. File a complaint as the student
4. Log in as **admin** → assign the complaint to the staff member
5. Log in as that **staff** account → update the complaint's status and
   add a remark
6. Log back in as the student → see the updated status and staff remark

## Status
✅ Core features complete: registration, login/logout, role-based
dashboards, complaint submission, staff updates, admin assignment, and
styling across all pages.

## Screenshots

**Login / Register**
![Login page](screenshots/login.png)

**Student Dashboard**
![Student dashboard](screenshots/student.png)

**Staff Dashboard**
![Staff dashboard](screenshots/staff.png)

**Admin Dashboard**
![Admin dashboard](screenshots/admin.png)

## Author

**Keerthana**
[GitHub](https://github.com/keerthana12-codes)