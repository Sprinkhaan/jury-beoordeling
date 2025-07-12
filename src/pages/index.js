import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { theme } from "../styles/theme";

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
  const [error, setError] = useState("");
  const router = useRouter();

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
      })
      .catch(() => setRonde(1)); // Fallback naar ronde 1 bij error
  }, []);

  const handleWachtwoordSubmit = (e) => {
    e.preventDefault();
    const gekozenCat = wachtwoordToCategorie[password];
    if (!gekozenCat) {
      setError("Ongeldig wachtwoord");
      return;
    }
    setCategorie(gekozenCat);
    setError("");
  };

  const handleVolgendeStap = async (e) => {
    e.preventDefault();
    if (!leeftijdsgroep || !naam) {
      setError("Vul alle velden in");
      return;
    }

    try {
      const res = await fetch("/api/ronde-status");
      const data = await res.json();
      const actueleRonde = data.ronde;

      localStorage.setItem("auth", "true");
      localStorage.setItem("categorie", categorie);
      localStorage.setItem("leeftijdsgroep", leeftijdsgroep);
      localStorage.setItem("jurylid", naam);
      localStorage.setItem("ronde", actueleRonde);

      router.push(actueleRonde === 2 ? "/herbeoordeling" : "/dashboard");
    } catch (err) {
      setError("Kon ronde status niet ophalen");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Jury Portaal</h1>
          <p>Log in om te beginnen met beoordelen</p>
        </div>

        {!ronde ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Systeem initialiseren...</p>
          </div>
        ) : !categorie ? (
          <form onSubmit={handleWachtwoordSubmit} className="login-form">
            <div className="input-group">
              <label>Jury Wachtwoord</label>
              <input
                type="password"
                placeholder="Voer jury wachtwoord in"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="primary-button">
              Verifiëren
            </button>
          </form>
        ) : (
          <form onSubmit={handleVolgendeStap} className="login-form">
            <div className="category-badge">
              {categorie.toUpperCase()}
            </div>

            <div className="input-group">
              <label>Leeftijdsgroep</label>
              <select
                value={leeftijdsgroep}
                onChange={(e) => setLeeftijdsgroep(e.target.value)}
                required
              >
                <option value="">Selecteer leeftijdsgroep</option>
                {leeftijdOpties[categorie].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Jury Naam</label>
              <input
                type="text"
                placeholder="Bijv. jurylid-1"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="primary-button">
              Start Beoordeling {ronde === 2 && "(Ronde 2)"}
            </button>
          </form>
        )}

        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
          color: ${theme.colors.primary};
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .login-header p {
          color: ${theme.colors.text};
          opacity: 0.8;
        }
        
        .login-form {
          margin-top: 1.5rem;
        }
        
        .input-group {
          margin-bottom: 1.25rem;
        }
        
        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: ${theme.colors.text};
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .input-group input,
        .input-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid ${theme.colors.border};
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        
        .input-group input:focus,
        .input-group select:focus {
          outline: none;
          border-color: ${theme.colors.primary};
        }
        
        .primary-button {
          width: 100%;
          background: ${theme.colors.primary};
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 0.5rem;
        }
        
        .primary-button:hover {
          background: #2563EB;
        }
        
        .category-badge {
          display: inline-block;
          background: ${theme.colors.secondary};
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
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
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem 0;
        }
        
        .spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: ${theme.colors.primary};
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
