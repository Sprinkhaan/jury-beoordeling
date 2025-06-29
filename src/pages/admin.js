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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const BESTANDEN = genereerBestandsnamen();

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

  if (loading) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>🔐 Toegang controleren...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
      <h1>🛠️ Admin Panel</h1>
      <h2>🧭 Huidige ronde: {status === 1 ? "1 (actief)" : "2 (herbeoordeling)"}</h2>

      <h3 style={{ marginTop: "1rem" }}>📊 Nog te beoordelen kandidaten:</h3>
      <ul>
        {Object.entries(tellers).map(([groep, aantal]) => (
          <li key={groep}>{groep}: <strong>{aantal}</strong></li>
        ))}
      </ul>

      {status === 1 && (
        <button
          onClick={startRonde2}
          style={{
            padding: "0.75rem 1.5rem",
            marginTop: "1rem",
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          🚀 Start Ronde 2
        </button>
      )}

      <hr style={{ margin: "2rem 0" }} />

      <h3>📂 Bekijk beoordelingsbestanden:</h3>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginBottom: "1.5rem",
      }}>
        {BESTANDEN.map((bestand) => (
          <button
            key={bestand}
            onClick={() => laadBestand(bestand)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#f1f1f1",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "black",
            }}
          >
            {bestand}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {inhoud && (
        <section style={{ marginTop: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>{inhoud.naam}</h2>
          <pre style={{
            background: "#f9f9f9",
            padding: "1rem",
            borderRadius: "8px",
            overflowX: "auto",
            maxHeight: "600px",
            fontSize: "0.85rem",
            whiteSpace: "pre-wrap"
          }}>
            {JSON.stringify(inhoud.data, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
