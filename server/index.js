const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const app = express();

app.use(cors());
app.use(express.json());

const users = require("./users");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// HOME
app.get("/", (req, res) => {
  res.send("Big B Study Hub API Running");
});

// SIGN UP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    return res.status(400).json({
      error: "User already exists"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    email,
    password: hashedPassword
  });

  res.json({
    message: "User created"
  });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(400).json({
      error: "User not found"
    });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json({
      error: "Invalid password"
    });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET || "secret123"
  );

  res.json({
    token
  });
});

// GOOGLE LOGIN
app.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: "Google credential is required"
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = users.find(u => u.email === email);

    if (!user) {
      user = {
        email,
        name,
        picture,
        google: true
      };

      users.push(user);
    }

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || "secret123"
    );

    res.json({
      message: "Google login successful",
      token,
      user: {
        email,
        name,
        picture
      }
    });

  } catch (error) {
    console.error("Google login error:", error);

    res.status(401).json({
      error: "Google authentication failed"
    });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
