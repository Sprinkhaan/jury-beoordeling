// src/pages/api/telling.js

import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const rawCat = req.query.categorie;
  const groep = req.query.groep;

  if (!rawCat || !groep) {
    return res.status(400).json({ error: "categorie en groep zijn verplicht" });
  }

  // Mapping van categorie naam zoals 'kind' naar bestandsmap label 'kinder'
  const categorieMap = {
    kind: "kinder",
    man: "mannen",
    vrouw: "vrouwen",
  };

  const categorie = categorieMap[rawCat] || rawCat;
  const dataMap = path.join(process.cwd(), "data");

  const bestanden = {
    ja: `ja_${categorie}-${groep}.json`,
    nee: `nee_${categorie}-${groep}.json`,
    twijfel: `twijfel_${categorie}-${groep}.json`,
    resterend: `${categorie}-${groep}.json`,
  };

  const telling = {};

  for (const [label, naam] of Object.entries(bestanden)) {
    const pad = path.join(dataMap, naam);
    if (fs.existsSync(pad)) {
      try {
        const inhoud = fs.readFileSync(pad, "utf-8");
        const lijst = JSON.parse(inhoud);
        telling[label] = Array.isArray(lijst) ? lijst.length : 0;
      } catch {
        telling[label] = 0;
      }
    } else {
      telling[label] = 0;
    }
  }

  return res.status(200).json(telling);
}
