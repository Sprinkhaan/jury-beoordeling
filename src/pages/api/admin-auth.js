export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { key } = req.body;

  if (!key || key !== process.env.REQUEST_KEY) {
    return res.status(401).json({ message: "Ongeldige sleutel" });
  }

  return res.status(200).json({ token: key });
}