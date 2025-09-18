require("dotenv").config();
const express = require("express");
const routes = require("./api/routes");

const app = express();
app.use(express.json()); // ✅ fixed

// root route (sanity check)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// API routes
app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
