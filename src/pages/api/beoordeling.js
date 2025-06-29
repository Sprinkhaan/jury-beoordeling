// src/pages/api/beoordeling.js

import fs from "fs";
import path from "path";

const basePath = path.join(process.cwd(), "data");

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const beoordeling = { ...req.body, timestamp: new Date().toISOString() };
  const { beoordeling: oordeel, categorie, leeftijdsgroep, kandidaat_id } = beoordeling;

  if (!oordeel || !categorie || !leeftijdsgroep || !kandidaat_id) {
    return res.status(400).json({ message: "Ontbrekende gegevens" });
  }

  let prefix = "";
  if (categorie.toLowerCase().includes("kind")) prefix = "kinder";
  else if (categorie.toLowerCase().includes("man")) prefix = "mannen";
  else if (categorie.toLowerCase().includes("vrouw")) prefix = "vrouwen";
  else return res.status(400).json({ message: "Onbekende categorie" });

  const bestandKey = `${prefix}-${leeftijdsgroep.replace(/\s/g, "-")}`.toLowerCase();
  const bronBestand = `${bestandKey}.json`;
  const doelBestand = `${oordeel.toLowerCase()}_${bestandKey}.json`;

  const bronPad = path.join(basePath, bronBestand);
  const doelPad = path.join(basePath, doelBestand);

  try {
    const bronData = fs.existsSync(bronPad) ? JSON.parse(fs.readFileSync(bronPad, "utf-8")) : [];
    const doelData = fs.existsSync(doelPad) ? JSON.parse(fs.readFileSync(doelPad, "utf-8")) : [];

    const kandidaat = bronData.find((k) => String(k.id) === String(kandidaat_id));
    if (!kandidaat) {
      return res.status(404).json({ message: "Kandidaat niet gevonden in originele bestand" });
    }

    const overblijvers = bronData.filter((k) => String(k.id) !== String(kandidaat_id));
    doelData.push({ ...kandidaat, beoordeling: oordeel, timestamp: beoordeling.timestamp, jurylid: beoordeling.jurylid });

    fs.writeFileSync(bronPad, JSON.stringify(overblijvers, null, 2));
    fs.writeFileSync(doelPad, JSON.stringify(doelData, null, 2));

    console.log(`📦 Kandidaat ${kandidaat_id} verplaatst naar ${doelBestand}`);
    return res.status(200).json({ message: "Beoordeling opgeslagen" });
  } catch (err) {
    console.error("❌ Fout bij verwerken beoordeling:", err);
    return res.status(500).json({ message: "Fout bij verwerken beoordeling" });
  }
}