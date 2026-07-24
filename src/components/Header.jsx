import { useEffect, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "../services/supabase.jsx";
import "../styles/header.css";

function Header() {
  const [totalAvistamentos, setTotalAvistamentos] = useState(0);
  const [animesUnicos, setAnimesUnicos] = useState(0);
  const location = useLocation();

  const carregarEstatisticas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("personagens")
        .select("anime");

      if (error) {
        console.error("Erro ao carregar estatísticas do header:", error);
        return;
      }

      if (data) {
        setTotalAvistamentos(data.length);
        const animes = new Set(data.map((p) => p.anime).filter(Boolean));
        setAnimesUnicos(animes.size);
      }
    } catch (err) {
      console.error("Erro inesperado no header:", err);
    }
  }, []);

  useEffect(() => {
    carregarEstatisticas();

    const handleUpdate = () => carregarEstatisticas();
    window.addEventListener("personagens-updated", handleUpdate);

    return () => {
      window.removeEventListener("personagens-updated", handleUpdate);
    };
  }, [carregarEstatisticas, location.pathname]);

  return (
    <header className="app-header">
      <div className="logo">
        <div className="logo-icon">
          <i className="fa-solid fa-bolt"></i>
        </div>
        <div>
          <div className="logo-text">POWER AURA</div>
          <div className="header-subtitle">Portal de Caçapava</div>
        </div>
      </div>

      <nav className="header-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <i className="fa-solid fa-users"></i>
          <span>Personagens</span>
        </NavLink>
        <NavLink
          to="/torneio"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <i className="fa-solid fa-trophy"></i>
          <span>Torneio</span>
        </NavLink>
      </nav>

      <div className="header-stats">
        <div className="header-stat">
          <span className="header-stat-value">{totalAvistamentos}</span>
          <span className="header-stat-label">avistamentos</span>
        </div>
        <div className="header-stat">
          <span className="header-stat-value">{animesUnicos}</span>
          <span className="header-stat-label">animes</span>
        </div>
      </div>
    </header>
  );
}

export default Header;