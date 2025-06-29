// src/pages/api/admin-json.js

import fs from "fs";
import path from "path";

// Genereer geldige bestandsnamen (veiligheidsmaatregel)
const CATEGORIEEN = ["kinder", "mannen", "vrouwen"];
const LEEFTIJDSGROEPEN = {
  kinder: ["4-5", "6-8", "9-12"],
  mannen: ["13-17", "18plus"],
  vrouwen: ["13-17", "18plus"],
};

const toegestaneBestanden = [];

for (const cat of CATEGORIEEN) {
  for (const groep of LEEFTIJDSGROEPEN[cat]) {
    const basis = `${cat}-${groep}.json`;
    toegestaneBestanden.push(basis);
    toegestaneBestanden.push(`ja_${basis}`);
    toegestaneBestanden.push(`nee_${basis}`);
    toegestaneBestanden.push(`twijfel_${basis}`);
  }
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (token !== process.env.REQUEST_KEY) {
    return res.status(401).json({ message: "Niet geautoriseerd" });
  }

  const bestand = req.query.bestand;

  if (!bestand || !toegestaneBestanden.includes(bestand)) {
    return res.status(400).json({ message: "Ongeldig of ontbrekend bestandsnaam" });
  }

  const bestandPad = path.join(process.cwd(), "data", bestand);

  try {
    const inhoud = fs.readFileSync(bestandPad, "utf-8");
    return res.status(200).json(JSON.parse(inhoud));
  } catch (err) {
    return res.status(500).json({
      message: "Fout bij lezen bestand",
      error: err.message,
    });
  }
}
