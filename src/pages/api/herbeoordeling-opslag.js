// src/pages/api/herbeoordeling-opslag.js

import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { jurylid, categorie, groep, beoordelingen } = req.body;

  if (!jurylid || !categorie || !groep || !beoordelingen) {
    return res.status(400).json({ error: "Incompleet verzoek" });
  }

  const dir = path.join(process.cwd(), "data", "herbeoordelingen");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filePath = path.join(dir, `${jurylid}_${categorie}-${groep}.json`);
  fs.writeFileSync(filePath, JSON.stringify(beoordelingen, null, 2));

  res.status(200).json({ status: "success" });
}
