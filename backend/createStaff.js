// createStaff.js
// Run this once with: node createStaff.js
// Creates a test staff account directly, without needing the browser.

const bcrypt = require("bcryptjs");
const { readDb, writeDb } = require("./db");

const db = readDb();

const username = "rao";

if (db.users.some((u) => u.username === username)) {
  console.log(`A user named "${username}" already exists — nothing created.`);
} else {
  const hash = bcrypt.hashSync("staff123", 10);
  db.users.push({
    id: db.nextUserId++,
    name: "Mr. Rao",
    username: username,
    password: hash,
    role: "staff",
    department: "Hostel",
  });
  writeDb(db);
  console.log(`Staff account created -> username: "${username}", password: "staff123"`);
}