import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { theme } from "../styles/theme";

export default function Herbeoordeling() {
  const [kandidaten, setKandidaten] = useState([]);
  const [beoordelingen, setBeoordelingen] = useState({});
  const [jurylid, setJurylid] = useState("");
  const [categorie, setCategorie] = useState("");
  const [groep, setGroep] = useState("");
  const [verdeling, setVerdeling] = useState({ ja: 0, twijfel: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [audioSpeed, setAudioSpeed] = useState(1);
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
    setLoading(true);
    try {
      const res = await fetch(`/api/herbeoordeling-data?categorie=${cat}&groep=${grp}`);
      const data = await res.json();

      const kandidatenJa = data.ja?.map(k => ({ ...k, via: "ja" })) || [];
      const kandidatenTwijfel = data.twijfel?.map(k => ({ ...k, via: "twijfel" })) || [];

      setKandidaten([...kandidatenJa, ...kandidatenTwijfel]);
      setVerdeling({
        ja: data.ja?.length || 0,
        twijfel: data.twijfel?.length || 0,
      });
    } catch (error) {
      console.error("Fout bij laden kandidaten:", error);
      setToast({ message: "Fout bij laden kandidaten", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (id, value) => {
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    setBeoordelingen(prev => ({
      ...prev,
      [id]: { ...prev[id], score: numValue }
    }));
  }
};

  const handleNotitieChange = (id, value) => {
    setBeoordelingen(prev => ({
      ...prev,
      [id]: { ...prev[id], notitie: value }
    }));
  };

  const handleSpeedChange = (speed) => {
    setAudioSpeed(speed);
    document.querySelectorAll("audio").forEach(audio => {
      audio.playbackRate = speed;
    });
  };

  const handleSubmit = async () => {
    const payload = kandidaten
      .filter(k => beoordelingen[k.id]?.score)
      .map(k => ({
        id: k.id,
        naam: k.naam,
        score: beoordelingen[k.id].score,
        notitie: beoordelingen[k.id]?.notitie || ""
      }))
      .sort((a, b) => b.score - a.score);

    try {
      const res = await fetch("/api/herbeoordeling-opslag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jurylid, categorie, groep, beoordelingen: payload })
      });

      if (!res.ok) throw new Error("Opslaan mislukt");

      setToast({ message: "Beoordelingen opgeslagen!", type: "success" });
      setTimeout(() => router.push("/"), 1500);
    } catch (error) {
      console.error("Fout bij opslaan:", error);
      setToast({ message: "Fout bij opslaan beoordelingen", type: "danger" });
    }
  };

  const downloadJSON = () => {
    const payload = kandidaten
      .filter(k => beoordelingen[k.id]?.score)
      .map(k => ({
        id: k.id,
        naam: k.naam,
        score: beoordelingen[k.id].score,
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

    setToast({ message: "Download gestart!", type: "success" });
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Kandidaten laden...</p>
      </div>
    );
  }

  return (
    <div className="herbeoordeling-container">
      {toast.message && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <header className="herbeoordeling-header">
        <div>
          <h1>Ronde 2 - Herbeoordeling</h1>
          <div className="jury-info">
            <span className="category-badge">{categorie.toUpperCase()}</span>
            <span className="group-badge">{groep}</span>
            <span className="jury-name">{jurylid}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Uitloggen
        </button>
      </header>

      <div className="stats-card">
        <h2>Overzicht</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-count">{kandidaten.length}</span>
            <span className="stat-label">Totaal</span>
          </div>
          <div className="stat-item success">
            <span className="stat-count">{verdeling.ja}</span>
            <span className="stat-label">Goedgekeurd</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-count">{verdeling.twijfel}</span>
            <span className="stat-label">Twijfel</span>
          </div>
        </div>
      </div>

      <div className="speed-controls-container">
        <p>Audio snelheid:</p>
        <div className="speed-controls">
          {[0.8, 1, 1.2].map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={audioSpeed === speed ? "active" : ""}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {kandidaten.length === 0 ? (
        <div className="no-candidates">
          <h2>Geen kandidaten om te herbeoordelen</h2>
          <p>Alle kandidaten zijn al beoordeeld of er zijn geen kandidaten beschikbaar.</p>
        </div>
      ) : (
        <>
          <div className="kandidaten-list">
            {kandidaten.map((k) => (
              <div key={k.id} className="kandidaat-card">
                <div className={`kandidaat-header ${k.via}`}>
                  {k.via === "twijfel" ? "⚠️ Twijfelgeval" : "✅ Goedgekeurd"}
                </div>
                <div className="kandidaat-body">
                  <div className="kandidaat-info">
                    <div className="info-row">
                      <span className="info-label">ID:</span>
                      <span className="info-value">{k.id}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Naam:</span>
                      <span className="info-value">{k.naam || "Onbekend"}</span>
                    </div>
                  </div>

                  <div className="audio-player-container">
                    <audio controls src={k.audio_url} className="audio-element" />
                  </div>

                  <div className="beoordeling-form">
                    <div className="input-group">
                      <label>Score (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        value={beoordelingen[k.id]?.score || ""}
                        onChange={(e) => handleScoreChange(k.id, e.target.value)}
                        placeholder="8.5"
                      />
                    </div>

                    <div className="input-group">
                      <label>Notitie (optioneel)</label>
                      <textarea
                        value={beoordelingen[k.id]?.notitie || ""}
                        onChange={(e) => handleNotitieChange(k.id, e.target.value)}
                        rows={2}
                        placeholder="Opmerkingen over de kandidaat..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="actions-container">
            <button onClick={handleSubmit} className="primary-button">
              Beoordelingen Opslaan
            </button>
            <button onClick={downloadJSON} className="secondary-button">
              Downloaden als JSON
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .herbeoordeling-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
          min-height: 100vh;
        }

        .herbeoordeling-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid ${theme.colors.border};
        }

        .herbeoordeling-header h1 {
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

        .stats-card {
          background: white;
          border-radius: 12px;
          box-shadow: ${theme.shadows.sm};
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .stats-card h2 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: ${theme.colors.text};
          font-size: 1.25rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid ${theme.colors.border};
        }

        .stat-item.success {
          background: #ECFDF5;
          border-color: #A7F3D0;
        }

        .stat-item.warning {
          background: #FFFBEB;
          border-color: #FDE68A;
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

        .speed-controls-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: ${theme.shadows.sm};
        }

        .speed-controls {
          display: flex;
          gap: 0.5rem;
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

        .kandidaten-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .kandidaat-card {
          background: white;
          border-radius: 12px;
          box-shadow: ${theme.shadows.sm};
          overflow: hidden;
        }

        .kandidaat-header {
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          color: white;
        }

        .kandidaat-header.ja {
          background: #10B981;
        }

        .kandidaat-header.twijfel {
          background: #F59E0B;
        }

        .kandidaat-body {
          padding: 1.5rem;
        }

        .kandidaat-info {
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
          margin: 1.5rem 0;
        }

        .audio-element {
          width: 100%;
        }

        .beoordeling-form {
          margin-top: 1.5rem;
        }

        .input-group {
          margin-bottom: 1.25rem;
        }

        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: ${theme.colors.text};
        }

        .input-group input,
        .input-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid ${theme.colors.border};
          border-radius: 8px;
          font-size: 1rem;
        }

        .input-group input:focus,
        .input-group textarea:focus {
          outline: none;
          border-color: ${theme.colors.primary};
        }

        .input-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .actions-container {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .primary-button {
          flex: 1;
          background: ${theme.colors.primary};
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .primary-button:hover {
          background: #2563EB;
        }

        .secondary-button {
          flex: 1;
          background: white;
          color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.primary};
          padding: 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          background: #EFF6FF;
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
            grid-template-columns: 1fr;
          }
          
          .actions-container {
            flex-direction: column;
          }
          
          .herbeoordeling-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
