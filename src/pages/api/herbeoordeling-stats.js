import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { categorie, groep } = req.query;

  if (!categorie || !groep) {
    return res.status(400).json({ error: "Categorie en groep zijn verplicht." });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (token !== process.env.REQUEST_KEY) {
    return res.status(401).json({ message: "Niet geautoriseerd" });
  }

  // 🛠️ Mapping van korte naam naar mapnaam
  const catMap = {
    kind: "kinder",
    kinder: "kinder",
    vrouw: "vrouwen",
    vrouwen: "vrouwen",
    man: "mannen",
    mannen: "mannen",
  };

  const mappedCategorie = catMap[categorie];
  if (!mappedCategorie) {
    return res.status(400).json({ error: "Ongeldige categorie" });
  }

  const dir = path.join(process.cwd(), "data", "herbeoordelingen");
  if (!fs.existsSync(dir)) {
    return res.status(200).json([]);
  }

  const bestanden = fs.readdirSync(dir).filter(file => {
    if (!file.endsWith(".json")) return false;

    const patterns = [
      `_${categorie}-${groep}`,        // short variant
      `_${mappedCategorie}-${groep}`, // mapped variant
      `_${catMap["kind"]}-${groep}`,  // expliciet 'kinder' variant
      `_kind-${groep}`                // expliciet 'kind' variant
    ];

    return patterns.some(pattern => file.includes(pattern));
  });

  console.log("📁 Gevonden bestanden:", bestanden);

  const kandidatenMap = {};

  bestanden.forEach(bestand => {
    const pad = path.join(dir, bestand);
    const inhoud = JSON.parse(fs.readFileSync(pad, "utf-8"));

    inhoud.forEach(({ id, naam, score }) => {
      if (!kandidatenMap[id]) {
        kandidatenMap[id] = {
          id,
          naam,
          totalScore: 0,
          count: 0,
        };
      }
      kandidatenMap[id].totalScore += parseFloat(score);
      kandidatenMap[id].count += 1;
    });
  });

  const resultaat = Object.values(kandidatenMap)
  .map(k => ({
    id: k.id,
    naam: k.naam,
    gemiddelde: parseFloat((k.totalScore / k.count).toFixed(2)), // Zorg dat het een number blijft
    aantalBeoordelingen: k.count,
  }))
  .sort((a, b) => b.gemiddelde - a.gemiddelde); // Sorteer van hoog naar laag

return res.status(200).json(resultaat);
}