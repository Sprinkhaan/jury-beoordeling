// src/pages/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchVolgendeKandidaat } from "../lib/apiClient";

export default function Dashboard() {
  const [kandidaat, setKandidaat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState("");
  const [riwaya, setRiwaya] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem("auth");
    const cat = localStorage.getItem("categorie");
    const riw = localStorage.getItem("riwaya");

    if (!isAuth || !cat || !riw) {
      router.push("/");
      return;
    }

    setCategorie(cat);
    setRiwaya(riw);
    laadVolgende(cat, riw);
  }, []);

  const laadVolgende = async (cat, riw) => {
    setLoading(true);
    const volgende = await fetchVolgendeKandidaat(cat, riw);
    setKandidaat(volgende);
    setLoading(false);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 1600);
  };

  const handleBeoordeling = async (keuze) => {
    const record = {
      kandidaat_id: kandidaat.id,
      naam: kandidaat.naam,
      telefoon: kandidaat.telefoon,
      audio_url: kandidaat.audio_url,
      categorie,
      riwaya,
      beoordeling: keuze,
      timestamp: new Date().toISOString(),
      jurylid: localStorage.getItem("auth"),
    };

    try {
      const res = await fetch("/api/beoordeling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });

      if (!res.ok) throw new Error(await res.text());

      showToast(
        keuze === "ja" ? "Goedkeuring opgeslagen" : "Afwijzing opgeslagen",
        keuze === "ja" ? "goed" : "afgekeurd"
      );

      setTimeout(() => {
        setToast({ message: "", type: "" });
        laadVolgende(categorie, riwaya);
      }, 1600);
    } catch (err) {
      console.error("Fout bij opslaan beoordeling:", err);
      alert("Er ging iets mis bij het opslaan van de beoordeling.");
    }
  };

    const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("categorie");
    localStorage.removeItem("riwaya");
    router.push("/");
  };

  if (loading) return <p className="loading">Bezig met laden...</p>;
  if (!kandidaat) return <p className="loading">Geen kandidaten meer te beoordelen.</p>;

  return (
    <main>
      {toast.message && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ marginBottom: "0.25rem" }}>Beoordelen:</h2>
          <p style={{ fontWeight: "bold" }}>{categorie} – Riwaya: {riwaya}</p>
        </div>
        <button onClick={handleLogout} style={{ background: "#ef4444" }}>Uitloggen</button>
      </header>

      <div className="card">
        <p><strong>Kandidaat ID:</strong> {kandidaat.id}</p>
        <p><strong>Naam:</strong> {kandidaat.naam || "Onbekend"}</p>
        <audio className="audio-player" controls src={kandidaat.audio_url}></audio>
      </div>

      <div className="button-group">
        <button className="goed" onClick={() => handleBeoordeling("ja")}>
          Goedkeuren
        </button>
        <button className="afgekeurd" onClick={() => handleBeoordeling("nee")}>
          Afwijzen
        </button>
      </div>
    </main>
  );
}