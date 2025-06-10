// src/pages/index.js

import { useState } from "react";
import { useRouter } from "next/router";

const wachtwoordToCategorie = {
  [process.env.NEXT_PUBLIC_JURY_WW_KINDER]: "Kindercompetitie 4 t/m 12 jaar",
  [process.env.NEXT_PUBLIC_JURY_WW_VROUW]: "Vrouwencompetitie 13 jaar en ouder",
  [process.env.NEXT_PUBLIC_JURY_WW_MAN]: "Mannencompetitie 13 jaar en ouder",
};

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [riwaya, setRiwaya] = useState("Warsh");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    const gekozenCategorie = wachtwoordToCategorie[password];
    if (!gekozenCategorie) {
      alert("Wachtwoord onjuist");
      return;
    }

    localStorage.setItem("auth", "true");
    localStorage.setItem("categorie", gekozenCategorie);
    localStorage.setItem("riwaya", riwaya);
    router.push("/dashboard");
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "400px", margin: "auto" }}>
      <h1>Jury Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Wachtwoord:</label>
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Riwaya:</label>
          <select
            value={riwaya}
            onChange={(e) => setRiwaya(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
          >
            <option value="Warsh">Warsh</option>
            <option value="Hafs">Hafs</option>
          </select>
        </div>

        <button type="submit" style={{ padding: "0.75rem", width: "100%" }}>
          Start beoordelen
        </button>
      </form>
    </main>
  );
}
