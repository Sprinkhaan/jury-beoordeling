// src/pages/api/herbeoordeling-data.js

import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { categorie, groep } = req.query;

  if (!categorie || !groep) {
    return res.status(400).json({ error: "Categorie en groep zijn verplicht." });
  }

  // 🛠️ Mapping van korte naam ("kind") naar bestandsmap ("kinder")
  const catMap = {
    kind: "kinder",
    vrouw: "vrouwen",
    man: "mannen",
  };

  const mappedCategorie = catMap[categorie];
  if (!mappedCategorie) {
    return res.status(400).json({ error: "Ongeldige categorie" });
  }

  const baseDir = path.join(process.cwd(), "data");

  const kandidatenJa = [];
  const kandidatenTwijfel = [];

  const bestanden = {
    ja: `ja_${mappedCategorie}-${groep}.json`,
    twijfel: `twijfel_${mappedCategorie}-${groep}.json`,
  };

  for (const [type, bestand] of Object.entries(bestanden)) {
    const pad = path.join(baseDir, bestand);
    if (fs.existsSync(pad)) {
      try {
        const inhoud = JSON.parse(fs.readFileSync(pad, "utf-8"));
        if (type === "ja") kandidatenJa.push(...inhoud);
        else if (type === "twijfel") kandidatenTwijfel.push(...inhoud);
      } catch (err) {
        console.error(`Fout bij lezen van ${bestand}:`, err.message);
      }
    }
  }

  return res.status(200).json({
    ja: kandidatenJa,
    twijfel: kandidatenTwijfel,
  });
}
