// src/pages/api/initieer-kandidaten.js

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const clientKey = req.headers["x-request-key"];
  if (clientKey !== process.env.REQUEST_KEY) {
    console.warn("❌ Ongeldige REQUEST_KEY bij initieer-kandidaten.");
    return res.status(403).json({ message: "Unauthorized" });
  }

  const GF_API_URL = process.env.NEXT_PUBLIC_GF_API_URL;
  const GF_FORM_ID = process.env.NEXT_PUBLIC_GF_FORM_ID;
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_GF_PUBLIC_KEY}:${process.env.NEXT_PUBLIC_GF_PRIVATE_KEY}`
  ).toString("base64");

  let currentPage = 1;
  let allEntries = [];

  console.log("📥 Ophalen van inzendingen gestart...");

  while (true) {
    const url = `${GF_API_URL}?form_ids=${GF_FORM_ID}&paging[page_size]=100&paging[current_page]=${currentPage}`;
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    const json = await response.json();
    if (!json.entries || json.entries.length === 0) break;

    allEntries.push(...json.entries);
    if (json.entries.length < 100) break;
    currentPage++;
  }

  console.log(`✅ In totaal ${allEntries.length} inzendingen opgehaald.`);

  const kandidaten = allEntries.map((entry) => {
    const naam = entry["14"] || entry["23"] || entry["34"] || "Onbekend";
    const email = entry["18"] || entry["30"] || entry["9"] || "";
    const telefoon = entry["19"] || entry["31"] || entry["10"] || "";
    const audio = entry["21"] || entry["33"] || entry["11"] || "";
    const categorie = entry["3"] || "";
    const riwaya = entry["36"] || entry["20"] || entry["32"] || "";

    return {
      id: entry.id,
      naam,
      email,
      telefoon,
      audio_url: audio,
      categorie,
      riwaya,
    };
  });

  const basePath = path.join(process.cwd(), "data");
  const groepen = {};

  for (const kandidaat of kandidaten) {
    const { categorie, riwaya } = kandidaat;
    if (!categorie || !riwaya) continue;

    let prefix = "";
    if (categorie.toLowerCase().includes("kind")) prefix = "kinder";
    else if (categorie.toLowerCase().includes("man")) prefix = "mannen";
    else if (categorie.toLowerCase().includes("vrouw")) prefix = "vrouwen";
    else continue;

    const key = `${prefix}-${riwaya.toLowerCase()}`;
    if (!groepen[key]) groepen[key] = [];
    groepen[key].push(kandidaat);
  }

  for (const [bestandNaam, lijst] of Object.entries(groepen)) {
    const pad = path.join(basePath, `${bestandNaam}.json`);
    lijst.sort((a, b) => Number(a.id) - Number(b.id));
    fs.writeFileSync(pad, JSON.stringify(lijst, null, 2));
    console.log(`💾 Bestand aangemaakt: ${bestandNaam}.json (${lijst.length})`);
  }

  return res.status(200).json({ message: "Kandidaten succesvol geïnitieerd." });
}