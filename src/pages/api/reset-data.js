// src/pages/api/reset-data.js

import fs from "fs";
import path from "path";

const bestandsnamen = [
  "ja_kinder_hafs.json",
  "ja_kinder_warsh.json",
  "ja_mannen_hafs.json",
  "ja_mannen_warsh.json",
  "ja_vrouwen_hafs.json",
  "ja_vrouwen_warsh.json",
  "nee_kinder_hafs.json",
  "nee_kinder_warsh.json",
  "nee_mannen_hafs.json",
  "nee_mannen_warsh.json",
  "nee_vrouwen_hafs.json",
  "nee_vrouwen_warsh.json",
  "kinder-hafs.json",
  "kinder-warsh.json",
  "mannen-hafs.json",
  "mannen-warsh.json",
  "vrouwen-hafs.json",
  "vrouwen-warsh.json",
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

  if (errors.length > 0) {
    console.error("⚠ Fouten bij reset:", errors);
    return res.status(500).json({
      message: "Sommige bestanden konden niet worden geleegd.",
      errors,
    });
  }

  console.log(`✅ ${successCount} bestanden succesvol geleegd.`);
  return res.status(200).json({ message: `Alle ${successCount} bestanden succesvol geleegd.` });
}