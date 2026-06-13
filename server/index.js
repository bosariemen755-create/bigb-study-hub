const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Big B Study Hub API Running");
});

app.listen(5000, () => {
  console.log("Server running");
});
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("./users");

// SIGN UP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({ email, password: hashedPassword });

  res.json({ message: "User created" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ email }, "secret123");

  res.json({ token });
});
