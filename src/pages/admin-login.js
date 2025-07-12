import { useState } from "react";
import { useRouter } from "next/router";
import { theme } from "../styles/theme";

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
      localStorage.setItem("admin_token_time", Date.now().toString());
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.message || "Ongeldige sleutel");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Admin Login</h1>
          <p>Voer uw beheerderssleutel in</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Admin sleutel</label>
            <input
              type="password"
              placeholder="••••••••"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="primary-button">
            Inloggen
          </button>
        </form>

        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${theme.colors.background};
          padding: 1rem;
        }
        
        .login-card {
          background: ${theme.colors.card};
          border-radius: 12px;
          box-shadow: ${theme.shadows.md};
          padding: 2rem;
          width: 100%;
          max-width: 400px;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .login-header h1 {
          color: ${theme.colors.text};
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .input-group {
          margin-bottom: 1.5rem;
        }
        
        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: ${theme.colors.text};
          font-size: 0.875rem;
        }
        
        .input-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid ${theme.colors.border};
          border-radius: 8px;
          font-size: 1rem;
        }
        
        .primary-button {
          width: 100%;
          background: ${theme.colors.primary};
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .primary-button:hover {
          background: #2563EB;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #EF4444;
          background: #FEE2E2;
          padding: 0.75rem;
          border-radius: 8px;
          margin-top: 1.5rem;
          font-size: 0.875rem;
        }
        
        .error-message svg {
          width: 1.25rem;
          height: 1.25rem;
        }
      `}</style>
    </div>
  );
}
