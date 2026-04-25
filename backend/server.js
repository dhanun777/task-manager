const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.log("DB ERROR:", err);
    process.exit(1); // stop server if DB fails
  });

/* ================= MODELS ================= */
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
});

const TaskSchema = new mongoose.Schema({
  userId: String,
  text: String,
  completed: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model("User", UserSchema);
const Task = mongoose.model("Task", TaskSchema);

/* ================= AUTH MIDDLEWARE ================= */
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

/* ================= TEST ROUTE ================= */
app.get("/", (req, res) => {
  res.send("API working");
});

/* ================= ROUTES ================= */

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Missing fields");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).send("User already exists");
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({ email, password: hashed });

    res.send("User created");

  } catch (err) {
    console.log("SIGNUP ERROR:", err);
    res.status(500).send("Signup error");
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Wrong password");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).send("Server error");
  }
});

// GET TASKS
app.get("/tasks", auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });
  res.json(tasks);
});

// ADD TASK
app.post("/tasks", auth, async (req, res) => {
  const task = await Task.create({
    userId: req.user.id,
    text: req.body.text
  });

  res.json(task);
});

// DELETE TASK
app.delete("/tasks/:id", auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

// UPDATE COMPLETE
app.put("/tasks/:id", auth, async (req, res) => {
  const { completed } = req.body;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { completed },
    { new: true }
  );

  res.json(task);
});

// EDIT TEXT
app.put("/tasks/edit/:id", auth, async (req, res) => {
  const { text } = req.body;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { text },
    { new: true }
  );

  res.json(task);
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});