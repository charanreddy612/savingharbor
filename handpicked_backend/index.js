import express from "express";

const app = express();

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));
