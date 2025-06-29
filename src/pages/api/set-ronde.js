// src/pages/api/set-ronde.js

import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Alleen POST toegestaan." });
  }

  const clientKey = req.headers["x-request-key"];
  if (clientKey !== process.env.REQUEST_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { ronde } = req.body;

  if (![1, 2].includes(ronde)) {
    return res.status(400).json({ message: "Ongeldige ronde" });
  }

  const pad = path.join(process.cwd(), "data", "ronde-status.json");

  try {
    fs.writeFileSync(pad, JSON.stringify({ ronde }, null, 2), "utf-8");
    console.log(`✅ Ronde-status gewijzigd naar ronde ${ronde}`);
    return res.status(200).json({ message: "Ronde succesvol gewijzigd" });
  } catch (err) {
    console.error("❌ Fout bij schrijven ronde-status.json:", err.message);
    return res.status(500).json({ message: "Kon bestand niet opslaan" });
  }
}
