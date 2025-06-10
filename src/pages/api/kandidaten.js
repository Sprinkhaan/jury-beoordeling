// src/pages/api/kandidaten.js

import fs from "fs";
import path from "path";

function handler(req, res) {
  const { categorie, riwaya } = req.query;

  if (!categorie || !riwaya) {
    return res.status(400).json({ error: "Categorie en riwaya zijn vereist." });
  }

  const prefix = categorie.toLowerCase().includes("kind")
    ? "kinder"
    : categorie.toLowerCase().includes("man")
    ? "mannen"
    : "vrouwen";

  const bestandsnaam = `${prefix}-${riwaya.toLowerCase()}.json`;
  const pad = path.join(process.cwd(), "data", bestandsnaam);

  try {
    if (!fs.existsSync(pad)) {
      return res.status(404).json({ error: `Bestand niet gevonden: ${bestandsnaam}` });
    }

    const inhoud = fs.readFileSync(pad, "utf-8");
    const kandidaten = JSON.parse(inhoud);

    kandidaten.sort((a, b) => Number(a.id) - Number(b.id));

    return res.status(200).json(kandidaten);
  } catch (err) {
    console.error("[FOUT] Kan kandidatenbestand niet lezen of verwerken:", err);
    return res.status(500).json({ error: "Interne fout bij ophalen kandidaten." });
  }
}

export default handler;