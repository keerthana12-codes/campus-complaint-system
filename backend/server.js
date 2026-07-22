// server.js
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { readDb, writeDb } = require("./db");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Serve the frontend files (index.html, student.html, css/, js/) automatically
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  session({
    secret: "campus-complaint-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

// ---------- Seed a default admin account on first run ----------
function seedAdmin() {
  const db = readDb();
  const hasAdmin = db.users.some((u) => u.role === "admin");
  if (!hasAdmin) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.users.push({
      id: db.nextUserId++,
      name: "Campus Admin",
      username: "admin",
      password: hash,
      role: "admin",
      department: "Administration",
    });
    writeDb(db);
    console.log('Seeded default admin -> username: "admin", password: "admin123"');
  }
}
seedAdmin();

// Removes the password field before sending user data back to the browser
function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// ---------- Auth routes ----------

// Students register themselves
app.post("/api/register", (req, res) => {
  const { name, username, password, department } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: "Name, username and password are required" });
  }
  const db = readDb();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: "Username already taken" });
  }
  const hash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: db.nextUserId++,
    name,
    username,
    password: hash,
    role: "student",
    department: department || "General",
  };
  db.users.push(newUser);
  writeDb(db);
  res.json({ message: "Registration successful. You can now log in.", user: publicUser(newUser) });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === (username || "").toLowerCase());
  if (!user || !bcrypt.compareSync(password || "", user.password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  req.session.userId = user.id;
  res.json({ message: "Login successful", user: publicUser(user) });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
  const db = readDb();
  const user = db.users.find((u) => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: "Not logged in" });
  res.json({ user: publicUser(user) });
});
// ---------- Middleware helpers ----------

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Not authorized for this action" });
    }
    req.currentUser = user;
    next();
  };
}

// ---------- Complaint routes ----------

const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const CATEGORIES = ["Hostel", "Academics", "Infrastructure", "Canteen", "Library", "IT/Network", "Other"];

// Student submits a complaint
app.post("/api/complaints", requireAuth, requireRole("student"), (req, res) => {
  const { title, category, description, location } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: "Title, category and description are required" });
  }
  const db = readDb();
  const complaint = {
    id: db.nextComplaintId++,
    title,
    category,
    description,
    location: location || "Not specified",
    status: "Pending",
    studentId: req.currentUser.id,
    assignedStaffId: null,
    remarks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.complaints.push(complaint);
  writeDb(db);
  res.json({ message: "Complaint submitted", complaint });
});

// Get complaints — role based visibility
app.get("/api/complaints", requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.session.userId);
  let complaints;

  if (user.role === "student") {
    complaints = db.complaints.filter((c) => c.studentId === user.id);
  } else if (user.role === "staff") {
    complaints = db.complaints.filter((c) => c.assignedStaffId === user.id || c.assignedStaffId === null);
  } else {
    complaints = db.complaints; // admin sees everything
  }

  res.json({ complaints });
});

app.get("/api/meta", (req, res) => {
  res.json({ statuses: STATUSES, categories: CATEGORIES });
});
// Staff or Admin updates a complaint's status and/or adds a remark
app.put("/api/complaints/:id", requireAuth, requireRole("staff", "admin"), (req, res) => {
  const { status, remark } = req.body;
  const db = readDb();
  const complaint = db.complaints.find((c) => c.id === Number(req.params.id));
  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  if (status) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    complaint.status = status;
  }
  if (remark) {
    complaint.remarks.push({
      by: req.currentUser.name,
      role: req.currentUser.role,
      text: remark,
      at: new Date().toISOString(),
    });
  }
  complaint.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json({ message: "Complaint updated", complaint });
});

// Admin creates a staff account
app.post("/api/staff", requireAuth, requireRole("admin"), (req, res) => {
  const { name, username, password, department } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: "Name, username and password are required" });
  }
  const db = readDb();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: "Username already taken" });
  }
  const hash = bcrypt.hashSync(password, 10);
  const newStaff = {
    id: db.nextUserId++,
    name,
    username,
    password: hash,
    role: "staff",
    department: department || "General",
  };
  db.users.push(newStaff);
  writeDb(db);
  res.json({ message: "Staff account created", user: publicUser(newStaff) });
});

// Admin: list all users (used to populate the "assign to staff" dropdown)
app.get("/api/users", requireAuth, requireRole("admin"), (req, res) => {
  const db = readDb();
  res.json({ users: db.users.map(publicUser) });
});

// Admin assigns a complaint to a staff member
app.put("/api/complaints/:id/assign", requireAuth, requireRole("admin"), (req, res) => {
  const { staffId } = req.body;
  const db = readDb();
  const complaint = db.complaints.find((c) => c.id === Number(req.params.id));
  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  const staff = db.users.find((u) => u.id === Number(staffId) && u.role === "staff");
  if (!staff) return res.status(400).json({ error: "Invalid staff member" });

  complaint.assignedStaffId = staff.id;
  if (complaint.status === "Pending") complaint.status = "In Progress";
  complaint.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json({ message: "Complaint assigned", complaint });
});

app.listen(PORT, () => {
  console.log(`Campus Complaint Management System running at http://localhost:${PORT}`);
});