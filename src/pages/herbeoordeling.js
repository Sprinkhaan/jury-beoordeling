// src/pages/herbeoordeling.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Herbeoordeling() {
  const [kandidaten, setKandidaten] = useState([]);
  const [beoordelingen, setBeoordelingen] = useState({});
  const [jurylid, setJurylid] = useState("");
  const [categorie, setCategorie] = useState("");
  const [groep, setGroep] = useState("");
  const [verdeling, setVerdeling] = useState({ ja: 0, twijfel: 0 });
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    const cat = localStorage.getItem("categorie");
    const grp = localStorage.getItem("leeftijdsgroep");
    const lid = localStorage.getItem("jurylid");

    if (!auth || !cat || !grp || !lid) {
      router.push("/");
      return;
    }

    setCategorie(cat);
    setGroep(grp);
    setJurylid(lid);
    laadKandidaten(cat, grp);
  }, []);

  const laadKandidaten = async (cat, grp) => {
    const res = await fetch(`/api/herbeoordeling-data?categorie=${cat}&groep=${grp}`);
    const data = await res.json();

    const kandidatenJa = data.ja.map(k => ({ ...k, via: "ja" }));
    const kandidatenTwijfel = data.twijfel.map(k => ({ ...k, via: "twijfel" }));

    setKandidaten([...kandidatenJa, ...kandidatenTwijfel]);
    setVerdeling({
      ja: data.ja.length,
      twijfel: data.twijfel.length,
    });
  };

  const handleScoreChange = (id, value) => {
    setBeoordelingen(prev => ({
      ...prev,
      [id]: { ...prev[id], score: value }
    }));
  };

  const handleNotitieChange = (id, value) => {
    setBeoordelingen(prev => ({
      ...prev,
      [id]: { ...prev[id], notitie: value }
    }));
  };

  const handleSubmit = async () => {
    const payload = kandidaten
      .filter(k => beoordelingen[k.id]?.score)
      .map(k => ({
        id: k.id,
        naam: k.naam,
        score: parseFloat(beoordelingen[k.id].score),
        notitie: beoordelingen[k.id]?.notitie || ""
      }))
      .sort((a, b) => b.score - a.score);

    const res = await fetch("/api/herbeoordeling-opslag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jurylid, categorie, groep, beoordelingen: payload })
    });

    if (res.ok) {
      alert("Beoordelingen opgeslagen!");
      router.push("/");
    } else {
      alert("Fout bij opslaan!");
    }
  };

  const downloadJSON = () => {
    const payload = kandidaten
      .filter(k => beoordelingen[k.id]?.score)
      .map(k => ({
        id: k.id,
        naam: k.naam,
        score: parseFloat(beoordelingen[k.id].score),
        notitie: beoordelingen[k.id]?.notitie || ""
      }))
      .sort((a, b) => b.score - a.score);

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${jurylid}_${categorie}-${groep}_herbeoordeling.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h2>Herbeoordeling – {categorie.toUpperCase()} ({groep})</h2>
      <p><strong>Jurylid:</strong> {jurylid}</p>

      <h3 style={{ margin: "1rem 0" }}>
        📊 Totaal kandidaten: {verdeling.ja + verdeling.twijfel} <br />
        ✅ Ja: {verdeling.ja} | ⚠️ Twijfel: {verdeling.twijfel}
      </h3>

      {kandidaten.length === 0 && (
        <p>Geen kandidaten om te herbeoordelen.</p>
      )}

      {kandidaten.map((k) => (
        <div key={k.id} className="card" style={{ marginBottom: "2rem" }}>
          <p style={{ fontWeight: "bold", color: k.via === "twijfel" ? "#f97316" : "#16a34a" }}>
            {k.via === "twijfel" ? "⚠️ TWIJFEL" : "✅ GOEDGEKEURD"}
          </p>
          <p><strong>ID:</strong> {k.id}</p>
          <p><strong>Naam:</strong> {k.naam || "Onbekend"}</p>
          <audio controls src={k.audio_url}></audio>

          <div style={{ marginTop: "1rem" }}>
            <label>Score (1–10):</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={beoordelingen[k.id]?.score || ""}
              onChange={(e) => handleScoreChange(k.id, parseFloat(e.target.value))}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
            />

            <label>Notitie (optioneel):</label>
            <textarea
              value={beoordelingen[k.id]?.notitie || ""}
              onChange={(e) => handleNotitieChange(k.id, e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
        </div>
      ))}

      {kandidaten.length > 0 && (
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <button onClick={handleSubmit} style={{ padding: "1rem", fontSize: "1rem" }}>
            ✅ Beoordelingen Opslaan
          </button>
          <button onClick={downloadJSON} style={{ padding: "1rem", fontSize: "1rem" }}>
            ⬇️ Download JSON
          </button>
        </div>
      )}
    </main>
  );
}
