
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================= MODELS ================= */
const UserSchema = new mongoose.Schema({
  email: String,
  password: String
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

/* ================= MIDDLEWARE ================= */
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

/* ================= ROUTES ================= */

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await User.create({ email, password: hashed });

  res.send("User created");
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
    console.log(err);
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

/* ================= START SERVER ================= */
app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
app.put("/tasks/:id", async (req, res) => {
  const { completed } = req.body;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { completed },
    { new: true }
  );

  res.json(task);
});
app.put("/tasks/edit/:id", async (req, res) => {
  const { text } = req.body;

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { text },
    { new: true }
  );

  res.json(task);
});