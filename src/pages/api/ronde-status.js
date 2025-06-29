// src/pages/api/ronde-status.js

import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const pad = path.join(process.cwd(), "data", "ronde-status.json");

  try {
    const inhoud = fs.readFileSync(pad, "utf-8");
    const data = JSON.parse(inhoud);

    // Verwacht formaat: { "ronde": 1 } of { "ronde": 2 }
    if (typeof data.ronde !== "number") {
      return res.status(400).json({ message: "Ongeldig ronde-nummer in statusbestand." });
    }

    return res.status(200).json({ ronde: data.ronde });
  } catch (err) {
    console.error("❌ Fout bij lezen ronde-status.json:", err.message);
    return res.status(500).json({ message: "Kan ronde-status niet lezen" });
  }
}
