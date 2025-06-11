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
      localStorage.setItem("admin_token", key);
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.message || "Ongeldige sleutel");
    }
  };

  return (
    <main style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="password"
          placeholder="Admin sleutel"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
        />
        <button type="submit" style={{ marginTop: "1rem" }}>Inloggen</button>
      </form>
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </main>
  );
}