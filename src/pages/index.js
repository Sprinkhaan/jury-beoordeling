import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const wachtwoordToCategorie = {
  [process.env.NEXT_PUBLIC_JURY_WW_KINDER]: "kind",
  [process.env.NEXT_PUBLIC_JURY_WW_VROUW]: "vrouw",
  [process.env.NEXT_PUBLIC_JURY_WW_MAN]: "man",
};

const leeftijdOpties = {
  kind: ["4-5", "6-8", "9-12"],
  vrouw: ["13-17", "18plus"],
  man: ["13-17", "18plus"],
};

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [categorie, setCategorie] = useState("");
  const [leeftijdsgroep, setLeeftijdsgroep] = useState("");
  const [naam, setNaam] = useState("");
  const [ronde, setRonde] = useState(null);
  const router = useRouter();

  // Reset oude localStorage bij openen loginpagina
  useEffect(() => {
    localStorage.removeItem("auth");
    localStorage.removeItem("categorie");
    localStorage.removeItem("leeftijdsgroep");
    localStorage.removeItem("jurylid");
    localStorage.removeItem("ronde");

    fetch("/api/ronde-status")
      .then((res) => res.json())
      .then((data) => {
        setRonde(data.ronde);
        localStorage.setItem("ronde", data.ronde);
      });
  }, []);

  const handleWachtwoordSubmit = (e) => {
    e.preventDefault();
    const gekozenCat = wachtwoordToCategorie[password];
    if (!gekozenCat) {
      alert("Wachtwoord onjuist");
      return;
    }
    setCategorie(gekozenCat);
  };

  const handleVolgendeStap = async (e) => {
    e.preventDefault();
    if (!leeftijdsgroep || !naam) {
      alert("Vul alle velden in.");
      return;
    }

    const res = await fetch("/api/ronde-status");
    const data = await res.json();
    const actueleRonde = data.ronde;

    localStorage.setItem("auth", "true");
    localStorage.setItem("categorie", categorie);
    localStorage.setItem("leeftijdsgroep", leeftijdsgroep);
    localStorage.setItem("jurylid", naam);
    localStorage.setItem("ronde", actueleRonde);

    if (actueleRonde === 2) {
      router.push("/herbeoordeling");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "500px", margin: "auto" }}>
      <h1>Jury Login</h1>

      {!ronde && <p>⏳ Laden...</p>}

      {ronde && !categorie ? (
        <form onSubmit={handleWachtwoordSubmit}>
          <label>Wachtwoord:</label>
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem", marginBottom: "1rem" }}
          />
          <button type="submit" style={{ width: "100%" }}>Volgende</button>
        </form>
      ) : ronde && categorie && (
        <form onSubmit={handleVolgendeStap}>
          <p><strong>Ingelogd als:</strong> {categorie.toUpperCase()}</p>

          <div style={{ margin: "1rem 0" }}>
            <label>Leeftijdsgroep:</label>
            <select
              value={leeftijdsgroep}
              onChange={(e) => setLeeftijdsgroep(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
            >
              <option value="">-- Kies een leeftijdsgroep --</option>
              {leeftijdOpties[categorie].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>Jury naam:</label>
            <input
              type="text"
              placeholder="Bijv. jurylid-1"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
            />
          </div>

          <button type="submit" style={{ width: "100%" }}>
            Start beoordeling {ronde === 2 ? "(Ronde 2)" : ""}
          </button>
        </form>
      )}
    </main>
  );
}
