// src/pages/admin-login.js

import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (res.ok) {
      // ✅ Token & timestamp opslaan
      localStorage.setItem("admin_token", key);
      localStorage.setItem("admin_token_time", Date.now().toString());

      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.message || "Ongeldige sleutel");
    }
  };

  return (
    <main style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h1>🔐 Admin Login</h1>
      <form onSubmit={handleLogin}>
        <label>Voer admin sleutel in:</label>
        <input
          type="password"
          placeholder="Admin sleutel"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
        />
        <button type="submit" style={{ marginTop: "1rem", width: "100%" }}>
          Inloggen
        </button>
      </form>
      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
      )}
    </main>
  );
}
