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

  const bestand = req.query.bestand;

  if (!bestand) {
    return res.status(400).json({ message: "Bestandsnaam ontbreekt" });
  }

  const bestandPath = path.join(process.cwd(), "data", bestand);

  try {
    const inhoud = fs.readFileSync(bestandPath, "utf-8");
    return res.status(200).json(JSON.parse(inhoud));
  } catch (err) {
    return res.status(500).json({ message: "Fout bij lezen bestand", error: err.message });
  }
}