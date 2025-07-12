// jury-platform/src/pages/api/herbeoordeling-bestanden.js

import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (token !== process.env.REQUEST_KEY) {
    return res.status(401).json({ message: "Niet geautoriseerd" });
  }

  const dir = path.join(process.cwd(), "data", "herbeoordelingen");

  try {
    if (!fs.existsSync(dir)) {
      return res.status(200).json([]); // Geen map = geen bestanden
    }

    const bestanden = fs.readdirSync(dir).filter(file => file.endsWith(".json"));
    return res.status(200).json(bestanden);

  } catch (err) {
    return res.status(500).json({
      message: "Fout bij lezen herbeoordelingen map",
      error: err.message,
    });
  }
}