import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const BESTANDEN = [
  "kinder-hafs.json",
  "kinder-warsh.json",
  "mannen-hafs.json",
  "mannen-warsh.json",
  "vrouwen-hafs.json",
  "vrouwen-warsh.json",
  "ja_kinder_hafs.json",
  "ja_kinder_warsh.json",
  "ja_mannen_hafs.json",
  "ja_mannen_warsh.json",
  "ja_vrouwen_hafs.json",
  "ja_vrouwen_warsh.json",
  "nee_kinder_hafs.json",
  "nee_kinder_warsh.json",
  "nee_mannen_hafs.json",
  "nee_mannen_warsh.json",
  "nee_vrouwen_hafs.json",
  "nee_vrouwen_warsh.json",
];

export default function Admin() {
  const [inhoud, setInhoud] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin-login");
    }
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

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "auto" }}>
      <h1>Admin Panel</h1>
      <p>Selecteer een bestand om te bekijken:</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {BESTANDEN.map((bestand) => (
          <button key={bestand} onClick={() => laadBestand(bestand)}>
            {bestand}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {inhoud && (
        <section style={{ marginTop: "2rem" }}>
          <h2>{inhoud.naam}</h2>
          <pre style={{ background: "#f0f0f0", padding: "1rem", overflowX: "auto", maxHeight: "400px" }}>
            {JSON.stringify(inhoud.data, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}