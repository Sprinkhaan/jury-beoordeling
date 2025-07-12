// jury-platform/src/pages/admin.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const CATEGORIEEN = ["kinder", "mannen", "vrouwen"];
const LEEFTIJDSGROEPEN = {
  kinder: ["4-5", "6-8", "9-12"],
  mannen: ["13-17", "18plus"],
  vrouwen: ["13-17", "18plus"],
};

function genereerBestandsnamen() {
  const base = [];
  for (const cat of CATEGORIEEN) {
    for (const groep of LEEFTIJDSGROEPEN[cat]) {
      base.push(`${cat}-${groep}.json`);
      base.push(`ja_${cat}-${groep}.json`);
      base.push(`nee_${cat}-${groep}.json`);
      base.push(`twijfel_${cat}-${groep}.json`);
    }
  }
  return base;
}

export default function Admin() {
  const [inhoud, setInhoud] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(1);
  const [tellers, setTellers] = useState({});
  const [herbeoordelingen, setHerbeoordelingen] = useState([]);
  const [stats, setStats] = useState([]);
  const [selectedCatGroup, setSelectedCatGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const BESTANDEN = genereerBestandsnamen();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const timestamp = localStorage.getItem("admin_token_time");

    const nu = Date.now();
    const verlopen = !timestamp || nu - parseInt(timestamp, 10) > 10 * 60 * 1000;

    if (!token || verlopen) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_time");
      router.replace("/admin-login");
      return;
    }

    fetch("/api/ronde-status")
      .then(res => res.json())
      .then(data => {
        setStatus(data.ronde);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_token_time");
        router.replace("/admin-login");
      });

    // Laad tellingen
    Promise.all(
      CATEGORIEEN.flatMap(cat =>
        LEEFTIJDSGROEPEN[cat].map(groep => {
          const bestandsnaam = `${cat}-${groep}.json`;
          return fetch(`/api/admin-json?bestand=${bestandsnaam}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => ({
              groep: `${cat}-${groep}`,
              aantal: Array.isArray(data) ? data.length : 0,
            }))
            .catch(() => ({
              groep: `${cat}-${groep}`,
              aantal: 0,
            }));
        })
      )
    ).then(resultaten => {
      const telling = {};
      resultaten.forEach(({ groep, aantal }) => {
        telling[groep] = aantal;
      });
      setTellers(telling);
    });

    // Laad herbeoordeling-bestanden
    fetch("/api/herbeoordeling-bestanden", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setHerbeoordelingen(data))
      .catch(() => setHerbeoordelingen([]));
  }, []);

  const laadBestand = async (bestand) => {
    const token = localStorage.getItem("admin_token");

    const res = await fetch(`/api/admin-json?bestand=${bestand}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      setError("Fout bij laden van bestand");
      return;
    }

    const data = await res.json();
    setInhoud({ naam: bestand, data });
    setError("");
  };

  const startRonde2 = async () => {
    const confirm = window.confirm("Weet je zeker dat je Ronde 2 wilt starten? Dit kan niet ongedaan worden.");
    if (!confirm) return;

    const res = await fetch("/api/set-ronde", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-key": localStorage.getItem("admin_token"),
      },
      body: JSON.stringify({ ronde: 2 }),
    });

    if (res.ok) {
      alert("✅ Ronde 2 is gestart!");
      setStatus(2);
    } else {
      alert("⚠️ Fout bij starten van Ronde 2.");
    }
  };

  const laadStats = async (categorie, groep) => {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/herbeoordeling-stats?categorie=${categorie}&groep=${groep}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      setStats(data);
      setSelectedCatGroup(`${categorie}-${groep}`);
    } else {
      setStats([]);
      setSelectedCatGroup("");
    }
  };

  if (loading) {
    return (
      <main className="admin-loading">
        <div className="loading-spinner"></div>
        <p>🔐 Toegang controleren...</p>
      </main>
    );
  }

  const handleDataReset = async () => {
    if (!window.confirm("⚠️ ALLE DATA WORDT GERESET!\nWeet je het zeker?")) return;
    
    try {
      const res = await fetch('/api/reset-data', {
        method: 'POST',
        headers: {
          'x-request-key': localStorage.getItem('admin_token')
        }
      });
      const data = await res.json();
      alert(data.message || "Reset voltooid!");
    } catch (err) {
      alert("Reset mislukt: " + err.message);
    }
  };

  const handleFetchData = async () => {
    if (!window.confirm("Nieuwe kandidaten ophalen uit WordPress?\nBestanden worden overschreven!")) return;
    
    setIsFetching(true);
    setFetchMessage('Bezig met ophalen...');

    try {
      const res = await fetch('/api/initieer-kandidaten', {
        method: 'POST',
        headers: {
          'x-request-key': localStorage.getItem('admin_token')
        }
      });
      const data = await res.json();
      
      setFetchMessage('Data opgehaald! Pagina vernieuwt...');
      setTimeout(() => {
        window.location.reload(); // Refresh de pagina
      }, 1500);
      
    } catch (err) {
      setFetchMessage('');
      alert("Ophalen mislukt: " + err.message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <main className="admin-container">
      <header className="admin-header">
         <section className="admin-actions">
          <h3>⚙️ Systeemacties</h3>
          <div className="action-buttons">
            <button 
              onClick={handleFetchData}
              className="action-button fetch-button"
              disabled={isFetching}
            >
              {isFetching ? (
                <span className="loading-spinner">🌀</span>
              ) : (
                '🔄 Data ophalen (WordPress)'
              )}
            </button>
          <button 
            onClick={handleDataReset}
            className="action-button reset-button"
          >
            🧹 Data resetten
          </button>
        </div>
        {fetchMessage && (
          <div className={`fetch-message ${isFetching ? 'fetching' : ''}`}>
            {fetchMessage}
          </div>
          )}
        </section>

        <h1>🛠️ Admin Dashboard</h1>
        <div className={`ronde-status ${status === 1 ? 'ronde-1' : 'ronde-2'}`}>
          Huidige ronde: {status === 1 ? "1 (actief)" : "2 (herbeoordeling)"}
        </div>
      </header>

      <section className="dashboard-grid">
        {/* Status Card */}
        <div className="dashboard-card">
          <h2 className="card-title">📊 Nog te beoordelen</h2>
          <div className="tellers-grid">
            {Object.entries(tellers).map(([groep, aantal]) => (
              <div key={groep} className="teller-item">
                <div className="teller-groep">{groep}</div>
                <div className="teller-aantal">{aantal}</div>
              </div>
            ))}
          </div>
          {status === 1 && (
            <button
              onClick={startRonde2}
              className="primary-button ronde-button"
            >
              🚀 Start Ronde 2
            </button>
          )}
        </div>

        {/* Bestanden Card */}
        <div className="dashboard-card">
          <h2 className="card-title">📂 Beoordelingsbestanden</h2>
          <div className="bestanden-grid">
            {BESTANDEN.map((bestand) => (
              <button
                key={bestand}
                onClick={() => laadBestand(bestand)}
                className="bestand-button"
              >
                {bestand.replace('.json', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Herbeoordeling Card */}
        <div className="dashboard-card">
          <h2 className="card-title">🔄 Herbeoordeling bestanden</h2>
          <div className="bestanden-grid">
            {herbeoordelingen.length > 0 ? (
              herbeoordelingen.map((bestand) => (
                <button
                  key={bestand}
                  onClick={() => laadBestand(`herbeoordelingen/${bestand}`)}
                  className="bestand-button herbeoordeling"
                >
                  {bestand.replace('.json', '')}
                </button>
              ))
            ) : (
              <p className="geen-data">Geen herbeoordelingsbestanden beschikbaar</p>
            )}
          </div>
        </div>

        {/* Statistieken Card */}
        <div className="dashboard-card stats-card">
          <h2 className="card-title">📈 Ronde 2 Statistieken</h2>
          <div className="stats-selector">
            {CATEGORIEEN.flatMap(cat =>
              LEEFTIJDSGROEPEN[cat].map(groep => (
                <button
                  key={`${cat}-${groep}`}
                  onClick={() => laadStats(cat, groep)}
                  className={`stats-button ${selectedCatGroup === `${cat}-${groep}` ? 'active' : ''}`}
                >
                  {cat}-{groep}
                </button>
              ))
            )}
          </div>

          {selectedCatGroup && (
            <div className="stats-resultaten">
              <h3>Resultaten voor: {selectedCatGroup}</h3>
              {stats.length === 0 ? (
                <p className="geen-data">Geen beoordelingen gevonden</p>
              ) : (
                <div className="stats-table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Naam</th>
                        <th>Gemiddelde</th>
                        <th>Aantal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map(k => (
                        <tr key={k.id}>
                          <td>{k.id}</td>
                          <td>{k.naam}</td>
                          <td>{k.gemiddelde}</td>
                          <td>{k.aantalBeoordelingen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {error && <div className="error-message">{error}</div>}

      {inhoud && (
        <section className="bestand-inhoud">
          <div className="bestand-header">
            <h2>{inhoud.naam}</h2>
            <button 
              onClick={() => setInhoud(null)} 
              className="close-button"
            >
              Sluiten
            </button>
          </div>
          <pre>
            {JSON.stringify(inhoud.data, null, 2)}
          </pre>
        </section>
      )}

      <style jsx>{`
        .admin-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
        }
        
        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 1rem;
        }

        .admin-actions {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .action-button {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fetch-button {
          background: #3b82f6;
          color: white;
        }

        .fetch-button:hover {
          background: #2563eb;
        }

        .reset-button {
          background: #ef4444;
          color: white;
        }

        .reset-button:hover {
          background: #dc2626;
        }

        @media (max-width: 768px) {
          .action-buttons {
            flex-direction: column;
          }
        }
        
        .loading-spinner {
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .admin-header h1 {
          margin: 0;
          font-size: 1.8rem;
          color: #1a365d;
        }
        
        .ronde-status {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .ronde-1 {
          background-color: #bee3f8;
          color: #2b6cb0;
        }
        
        .ronde-2 {
          background-color: #fed7d7;
          color: #c53030;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .dashboard-card {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .card-title {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.2rem;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        
        .tellers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .teller-item {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
          text-align: center;
        }
        
        .teller-groep {
          font-size: 0.8rem;
          color: #718096;
          margin-bottom: 0.25rem;
        }
        
        .teller-aantal {
          font-size: 1.2rem;
          font-weight: bold;
          color: #2b6cb0;
        }
        
        .primary-button {
          background-color: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          width: 100%;
        }
        
        .primary-button:hover {
          background-color: #3182ce;
        }
        
        .ronde-button {
          background-color: #48bb78;
        }
        
        .ronde-button:hover {
          background-color: #38a169;
        }
        
        .bestanden-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.75rem;
        }
        
        .bestand-button {
          background: #edf2f7;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          padding: 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .bestand-button:hover {
          background: #e2e8f0;
          border-color: #a0aec0;
        }
        
        .herbeoordeling {
          background: #ebf8ff;
          border-color: #bee3f8;
        }
        
        .herbeoordeling:hover {
          background: #d6eefd;
        }
        
        .stats-card {
          grid-column: 1 / -1;
        }
        
        .stats-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .stats-button {
          background: #e2e8f0;
          border: none;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .stats-button:hover, .stats-button.active {
          background: #4299e1;
          color: white;
        }
        
        .stats-resultaten {
          margin-top: 1rem;
        }
        
        .stats-resultaten h3 {
          margin-top: 0;
          font-size: 1.1rem;
          color: #4a5568;
        }
        
        .stats-table-container {
          overflow-x: auto;
        }
        
        .stats-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        
        .stats-table th, .stats-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .stats-table th {
          background: #f7fafc;
          font-weight: 600;
          color: #4a5568;
        }
        
        .stats-table tr:hover {
          background: #f8fafc;
        }
        
        .geen-data {
          color: #718096;
          font-style: italic;
          text-align: center;
          padding: 1rem;
        }
        
        .error-message {
          background: #fff5f5;
          color: #c53030;
          padding: 1rem;
          border-radius: 6px;
          margin: 1rem 0;
          border: 1px solid #fed7d7;
        }
        
        .bestand-inhoud {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin-top: 2rem;
        }
        
        .bestand-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .bestand-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #2d3748;
        }
        
        .close-button {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .close-button:hover {
          background: #e2e8f0;
        }
        
        pre {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 6px;
          overflow-x: auto;
          max-height: 500px;
          font-size: 0.85rem;
          border: 1px solid #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .tellers-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </main>
  );
}
