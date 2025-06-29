// src/pages/api/reset-data.js

import fs from "fs";
import path from "path";

const bestandsnamen = [
  // Kinder
  "kinder-4-5.json",
  "kinder-6-8.json",
  "kinder-9-12.json",
  "ja_kinder-4-5.json",
  "ja_kinder-6-8.json",
  "ja_kinder-9-12.json",
  "nee_kinder-4-5.json",
  "nee_kinder-6-8.json",
  "nee_kinder-9-12.json",
  "twijfel_kinder-4-5.json",
  "twijfel_kinder-6-8.json",
  "twijfel_kinder-9-12.json",

  // Mannen
  "mannen-13-17.json",
  "mannen-18plus.json",
  "ja_mannen-13-17.json",
  "ja_mannen-18plus.json",
  "nee_mannen-13-17.json",
  "nee_mannen-18plus.json",
  "twijfel_mannen-13-17.json",
  "twijfel_mannen-18plus.json",

  // Vrouwen
  "vrouwen-13-17.json",
  "vrouwen-18plus.json",
  "ja_vrouwen-13-17.json",
  "ja_vrouwen-18plus.json",
  "nee_vrouwen-13-17.json",
  "nee_vrouwen-18plus.json",
  "twijfel_vrouwen-13-17.json",
  "twijfel_vrouwen-18plus.json",
];

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Alleen POST is toegestaan." });
  }

  const clientKey = req.headers["x-request-key"];
  if (clientKey !== process.env.REQUEST_KEY) {
    console.warn("❌ Ongeldige REQUEST_KEY bij reset-data.");
    return res.status(403).json({ message: "Unauthorized" });
  }

  const dataMap = path.join(process.cwd(), "data");

  let successCount = 0;
  const errors = [];

  bestandsnamen.forEach((bestand) => {
    const pad = path.join(dataMap, bestand);
    try {
      fs.writeFileSync(pad, "[]", "utf-8");
      successCount++;
    } catch (err) {
      errors.push({ bestand, fout: err.message });
    }
  });

  // Zet ronde-status.json terug naar ronde 1
  const rondeStatusPad = path.join(dataMap, "ronde-status.json");
  try {
    fs.writeFileSync(rondeStatusPad, JSON.stringify({ ronde: 1 }, null, 2), "utf-8");
    console.log("🔄 Ronde-status teruggezet naar 1.");
  } catch (err) {
    console.error("⚠️ Fout bij schrijven ronde-status.json:", err.message);
    errors.push({ bestand: "ronde-status.json", fout: err.message });
  }

  if (errors.length > 0) {
    console.error("⚠️ Fouten bij reset:", errors);
    return res.status(500).json({
      message: "Sommige bestanden konden niet worden geleegd.",
      errors,
    });
  }

  console.log(`🧹 Reset voltooid: ${successCount} bestanden leeggemaakt.`);
  return res.status(200).json({ message: `Alle ${successCount} bestanden succesvol geleegd.` });
}
