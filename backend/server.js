require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/account");

const app = express();

// --- Middleware ---
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
);
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// Rate limiting: protect auth endpoints from brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: "Trop de requêtes, veuillez réessayer plus tard" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// --- Database connection ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/atm";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
  res
    .status(404)
    .json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// --- Serve the built React app in production (frontend/dist) ---
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Fallback SPA : les requêtes de navigation (sans extension de fichier)
  // renvoient l'application React ; les ressources manquantes restent en 404.
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/api") &&
      path.extname(req.path) === ""
    ) {
      return res.sendFile(path.join(frontendDist, "index.html"));
    }
    next();
  });
}

// Central error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Erreur serveur" });
});

if (!process.env.JWT_SECRET) {
  console.warn(
    "ATTENTION : JWT_SECRET n'est pas défini. Utilisation d'un secret par défaut non sécurisé — définissez JWT_SECRET dans .env pour tout déploiement réel."
  );
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
