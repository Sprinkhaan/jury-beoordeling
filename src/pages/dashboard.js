import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchVolgendeKandidaat } from "../lib/apiClient";

export default function Dashboard() {
  const [kandidaat, setKandidaat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState("");
  const [leeftijdsgroep, setLeeftijdsgroep] = useState("");
  const [jurylid, setJurylid] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [stats, setStats] = useState({ ja: 0, nee: 0, twijfel: 0, resterend: 0 });

  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem("auth");
    const cat = localStorage.getItem("categorie");
    const groep = localStorage.getItem("leeftijdsgroep");
    const lid = localStorage.getItem("jurylid");

    if (!isAuth || !cat || !groep || !lid) {
      router.push("/");
      return;
    }

    setCategorie(cat);
    setLeeftijdsgroep(groep);
    setJurylid(lid);
    laadVolgende(cat, groep);
    laadStats(cat, groep);
  }, []);

  const laadVolgende = async (cat, groep) => {
    setLoading(true);
    const volgende = await fetchVolgendeKandidaat(cat, groep);
    setKandidaat(volgende);
    setLoading(false);
  };

  const laadStats = async (cat, groep) => {
    try {
      const res = await fetch(`/api/telling?categorie=${cat}&groep=${groep}`);
      if (!res.ok) throw new Error("Stats ophalen mislukt");

      const data = await res.json();
      setStats({
        ja: data.ja || 0,
        nee: data.nee || 0,
        twijfel: data.twijfel || 0,
        resterend: data.resterend || 0,
      });
    } catch (err) {
      console.error("Fout bij laden van stats:", err.message);
    }
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
      leeftijdsgroep,
      riwaya: kandidaat.riwaya,
      beoordeling: keuze,
      timestamp: new Date().toISOString(),
      jurylid,
    };

    try {
      const res = await fetch("/api/beoordeling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });

      if (!res.ok) throw new Error(await res.text());

      const messages = {
        ja: { msg: "✅ Goedgekeurd", type: "goed" },
        nee: { msg: "❌ Afgewezen", type: "afgekeurd" },
        twijfel: { msg: "⚠️ Twijfel opgeslagen", type: "twijfel" },
      };

      const { msg, type } = messages[keuze] || {};
      showToast(msg, type);

      setTimeout(() => {
        setToast({ message: "", type: "" });
        laadVolgende(categorie, leeftijdsgroep);
        laadStats(categorie, leeftijdsgroep);
      }, 1600);
    } catch (err) {
      console.error("Fout bij opslaan beoordeling:", err);
      alert("Er ging iets mis bij het opslaan van de beoordeling.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (loading) return <p className="loading">Bezig met laden...</p>;
  if (!kandidaat) return <p className="loading">Geen kandidaten meer te beoordelen.</p>;

  return (
    <main>
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        <div>
          <h2>Beoordelen: {categorie.toUpperCase()} ({leeftijdsgroep})</h2>
          <p style={{ marginTop: "0.5rem" }}><strong>Jury:</strong> {jurylid}</p>
        </div>
        <button onClick={handleLogout} style={{ background: "#ef4444" }}>Uitloggen</button>
      </header>

      <section style={{
        marginBottom: "2rem",
        background: "#f1f5f9",
        padding: "1rem",
        borderRadius: "8px"
      }}>
        <h3>📊 Voortgang:</h3>
        <p>✅ Goedgekeurd: {stats.ja}</p>
        <p>❌ Afgewezen: {stats.nee}</p>
        <p>⚠️ Twijfel: {stats.twijfel}</p>
        <p>🕐 Nog te beoordelen: {stats.resterend}</p>
      </section>

      <div className="card">
        <p><strong>ID:</strong> {kandidaat.id}</p>
        <p><strong>Naam:</strong> {kandidaat.naam || "Onbekend"}</p>
        <p><strong>Riwaya:</strong> {kandidaat.riwaya || "Onbekend"}</p>
        <audio className="audio-player" controls src={kandidaat.audio_url}></audio>
      </div>

      <div className="button-group">
        <button className="goed" onClick={() => handleBeoordeling("ja")}>Goedkeuren</button>
        <button className="afgekeurd" onClick={() => handleBeoordeling("nee")}>Afwijzen</button>
        <button className="twijfel" onClick={() => handleBeoordeling("twijfel")}>Twijfel</button>
      </div>
    </main>
  );
}
