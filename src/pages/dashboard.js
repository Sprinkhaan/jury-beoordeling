import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchVolgendeKandidaat } from "../lib/apiClient";
import { theme } from "../styles/theme";

export default function Dashboard() {
  const [kandidaat, setKandidaat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState("");
  const [leeftijdsgroep, setLeeftijdsgroep] = useState("");
  const [jurylid, setJurylid] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [stats, setStats] = useState({ ja: 0, nee: 0, twijfel: 0, resterend: 0 });
  const [audioSpeed, setAudioSpeed] = useState(1);

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
    try {
      const volgende = await fetchVolgendeKandidaat(cat, groep);
      setKandidaat(volgende);
    } catch (error) {
      console.error("Fout bij laden kandidaat:", error);
    }
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
    if (!kandidaat) return;

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
        ja: { msg: "✅ Goedgekeurd", type: "success" },
        nee: { msg: "❌ Afgewezen", type: "danger" },
        twijfel: { msg: "⚠️ Twijfel opgeslagen", type: "warning" },
      };

      const { msg, type } = messages[keuze] || {};
      showToast(msg, type);

      setTimeout(() => {
        laadVolgende(categorie, leeftijdsgroep);
        laadStats(categorie, leeftijdsgroep);
      }, 1600);
    } catch (err) {
      console.error("Fout bij opslaan beoordeling:", err);
      showToast("⚠️ Opslaan mislukt", "danger");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleSpeedChange = (speed) => {
    setAudioSpeed(speed);
    const audio = document.querySelector("audio");
    if (audio) audio.playbackRate = speed;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Kandidaat laden...</p>
      </div>
    );
  }

  if (!kandidaat) {
    return (
      <div className="no-candidates">
        <h2>🎉 Gefeliciteerd!</h2>
        <p>Er zijn geen kandidaten meer om te beoordelen.</p>
        <button onClick={handleLogout} className="logout-button">
          Uitloggen
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {toast.message && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <header className="dashboard-header">
        <div>
          <h1>Beoordelingspanel</h1>
          <div className="jury-info">
            <span className="category-badge">{categorie.toUpperCase()}</span>
            <span className="group-badge">{leeftijdsgroep}</span>
            <span className="jury-name">{jurylid}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Uitloggen
        </button>
      </header>

      <div className="stats-card">
        <h2>Voortgang</h2>
        <div className="stats-grid">
          <div className="stat-item success">
            <span className="stat-count">{stats.ja}</span>
            <span className="stat-label">Goedgekeurd</span>
          </div>
          <div className="stat-item danger">
            <span className="stat-count">{stats.nee}</span>
            <span className="stat-label">Afgewezen</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-count">{stats.twijfel}</span>
            <span className="stat-label">Twijfel</span>
          </div>
          <div className="stat-item info">
            <span className="stat-count">{stats.resterend}</span>
            <span className="stat-label">Resterend</span>
          </div>
        </div>
      </div>

      <div className="candidate-card">
        <h2>Huidige kandidaat</h2>
        <div className="candidate-info">
          <div className="info-row">
            <span className="info-label">ID:</span>
            <span className="info-value">{kandidaat.id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Naam:</span>
            <span className="info-value">{kandidaat.naam || "Onbekend"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Riwaya:</span>
            <span className="info-value">{kandidaat.riwaya || "Onbekend"}</span>
          </div>
        </div>

        <div className="audio-player-container">
          <audio controls src={kandidaat.audio_url} className="audio-element" />
          <div className="speed-controls">
            <button 
              onClick={() => handleSpeedChange(0.8)} 
              className={audioSpeed === 0.8 ? "active" : ""}
            >
              0.8x
            </button>
            <button 
              onClick={() => handleSpeedChange(1)} 
              className={audioSpeed === 1 ? "active" : ""}
            >
              1x
            </button>
            <button 
              onClick={() => handleSpeedChange(1.2)} 
              className={audioSpeed === 1.2 ? "active" : ""}
            >
              1.2x
            </button>
          </div>
        </div>
      </div>

      <div className="actions-container">
        <button 
          onClick={() => handleBeoordeling("ja")} 
          className="action-button success"
        >
          Goedkeuren
        </button>
        <button 
          onClick={() => handleBeoordeling("twijfel")} 
          className="action-button warning"
        >
          Twijfel
        </button>
        <button 
          onClick={() => handleBeoordeling("nee")} 
          className="action-button danger"
        >
          Afwijzen
        </button>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid ${theme.colors.border};
        }

        .dashboard-header h1 {
          color: ${theme.colors.primary};
          margin-bottom: 0.5rem;
        }

        .jury-info {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .category-badge, .group-badge, .jury-name {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .category-badge {
          background: ${theme.colors.primary};
          color: white;
        }

        .group-badge {
          background: ${theme.colors.secondary};
          color: white;
        }

        .jury-name {
          background: #E5E7EB;
          color: #4B5563;
        }

        .logout-button {
          background: #EF4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-button:hover {
          background: #DC2626;
        }

        .stats-card, .candidate-card {
          background: white;
          border-radius: 12px;
          box-shadow: ${theme.shadows.sm};
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .stats-card h2, .candidate-card h2 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: ${theme.colors.text};
          font-size: 1.25rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
          padding: 1rem;
          border-radius: 8px;
        }

        .stat-item.success {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
        }

        .stat-item.danger {
          background: #FEF2F2;
          border: 1px solid #FECACA;
        }

        .stat-item.warning {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
        }

        .stat-item.info {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
        }

        .stat-count {
          display: block;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6B7280;
        }

        .candidate-info {
          margin-bottom: 1.5rem;
        }

        .info-row {
          display: flex;
          margin-bottom: 0.5rem;
        }

        .info-label {
          font-weight: 500;
          width: 80px;
          color: #6B7280;
        }

        .info-value {
          flex: 1;
        }

        .audio-player-container {
          margin-top: 1.5rem;
        }

        .audio-element {
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .speed-controls {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .speed-controls button {
          background: #E5E7EB;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .speed-controls button.active {
          background: ${theme.colors.primary};
          color: white;
        }

        .actions-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .action-button {
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: ${theme.shadows.sm};
        }

        .action-button.success {
          background: #10B981;
          color: white;
        }

        .action-button.warning {
          background: #F59E0B;
          color: white;
        }

        .action-button.danger {
          background: #EF4444;
          color: white;
        }

        .toast {
          position: fixed;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 100;
          animation: fadeIn 0.3s;
        }

        .toast.success {
          background: #10B981;
        }

        .toast.warning {
          background: #F59E0B;
        }

        .toast.danger {
          background: #EF4444;
        }

        .loading-container, .no-candidates {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }

        .spinner {
          width: 3rem;
          height: 3rem;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: ${theme.colors.primary};
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .actions-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}