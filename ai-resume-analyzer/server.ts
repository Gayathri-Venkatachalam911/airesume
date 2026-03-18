import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Initialize Database Tables
console.log("Initializing database...");
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('SEEKER', 'RECRUITER')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recruiter_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      skills TEXT NOT NULL,
      FOREIGN KEY (recruiter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('SELECTED', 'REJECTED', 'PENDING')) DEFAULT 'PENDING',
      ats_score INTEGER,
      match_percentage INTEGER,
      analysis_result TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  console.log("Database initialized successfully.");
} catch (e: any) {
  console.error("Database initialization error:", e.message);
}

const app = express();
app.use(express.json());
app.use(cors());

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log("Signup attempt:", { name, email, role });
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const info = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, role);
    console.log("Signup successful for:", email);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e: any) {
    console.error("Signup error:", e.message);
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);
  try {
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      console.log("Login failed: User not found:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Login failed: Invalid password for:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
    console.log("Login successful for:", email);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    console.error("Login error:", e.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- JOB ROUTES ---
app.post("/api/jobs/create", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'RECRUITER') return res.sendStatus(403);
  const { title, description, skills } = req.body;
  const info = db.prepare("INSERT INTO jobs (recruiter_id, title, description, skills) VALUES (?, ?, ?, ?)").run(req.user.id, title, description, skills);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/jobs", authenticateToken, (req, res) => {
  const jobs = db.prepare("SELECT * FROM jobs").all();
  res.json(jobs);
});

app.delete("/api/jobs/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'RECRUITER') return res.sendStatus(403);
  db.prepare("DELETE FROM jobs WHERE id = ? AND recruiter_id = ?").run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// --- RESUME & ANALYSIS ROUTES ---
app.post("/api/resume/extract", authenticateToken, upload.single('resume'), async (req: any, res) => {
  if (req.user.role !== 'SEEKER') return res.sendStatus(403);
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  let text = "";
  try {
    console.log("Extracting text from file:", file.originalname, "MimeType:", file.mimetype);
    if (file.mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: file.buffer });
      const data = await parser.getText();
      text = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else {
      console.warn("Unsupported file type:", file.mimetype);
      return res.status(400).json({ error: "Unsupported file type" });
    }
    console.log("Extracted text length:", text.length);
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract any text from the file. Please ensure the file is not empty or password protected." });
    }
    res.json({ text });
  } catch (e) {
    console.error("Text extraction error:", e);
    res.status(500).json({ error: "Text extraction failed" });
  }
});

app.post("/api/applications/save", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'SEEKER') return res.sendStatus(403);
  const { jobId, status, ats_score, match_percentage, analysis_result } = req.body;
  
  const info = db.prepare(`
    INSERT INTO applications (job_id, user_id, status, ats_score, match_percentage, analysis_result)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(jobId, req.user.id, status, ats_score, match_percentage, JSON.stringify(analysis_result));

  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/applications", authenticateToken, (req: any, res) => {
  let apps;
  if (req.user.role === 'RECRUITER') {
    apps = db.prepare(`
      SELECT a.*, u.name as applicant_name, j.title as job_title 
      FROM applications a 
      JOIN users u ON a.user_id = u.id 
      JOIN jobs j ON a.job_id = j.id 
      WHERE j.recruiter_id = ?
    `).all(req.user.id);
  } else {
    apps = db.prepare(`
      SELECT a.*, j.title as job_title 
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      WHERE a.user_id = ?
    `).all(req.user.id);
  }
  res.json(apps);
});

app.post("/api/applications/:id/status", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'RECRUITER') return res.sendStatus(403);
  const { status } = req.body;
  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
  res.sendStatus(204);
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
