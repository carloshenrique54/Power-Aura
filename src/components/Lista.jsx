import { useMemo } from "react"
import { supabase } from "../services/supabase.jsx"

function getImagemUrl(nomeArquivo) {
  if (!nomeArquivo) return null
  const { data } = supabase.storage.from("Imagem").getPublicUrl(nomeArquivo)
  return data?.publicUrl || null
}

function formatarData(dataISO) {
  if (!dataISO) return "Sem data"
  const data = new Date(dataISO)
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function ListaPersonagens({
  personagens,
  busca,
  setBusca,
  carregando,
  erro,
  onEditar,
  onExcluir,
}) {
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return personagens
    return personagens.filter((p) => p.nome?.toLowerCase().includes(termo))
  }, [busca, personagens])

  return (
    <section className="panel-lista">
      <div className="panel-header">
        <h2 className="panel-title">Personagens Avistados</h2>
        <p className="panel-desc">
          Registros dos moradores sobre a fenda dimensional
        </p>
      </div>

      <div className="search-area">
        <div className="search-wrapper">
          <svg
            className="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="14"
            height="14"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nome do personagem..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {filtrados.length > 0 && (
        <div className="resultado-count">
          {filtrados.length}{" "}
          {filtrados.length === 1 ? "resultado" : "resultados"}
          {busca && ` para "${busca}"`}
        </div>
      )}

      {carregando && (
        <div className="carregando">
          <div className="spinner" />
          <span className="carregando-text">Carregando registros...</span>
        </div>
      )}

      {erro && <div className="erro-msg">{erro}</div>}

      <div className="lista-scroll">
        {!carregando && !erro && filtrados.length === 0 && (
          <div className="lista-vazia">
            <div className="lista-vazia-icone"><i className="fa-solid fa-bolt" /></div>
            <p className="lista-vazia-texto">
              {busca
                ? `Nenhum personagem encontrado para "${busca}".`
                : "Nenhum personagem avistado ainda. Use o formulário ao lado para registrar."}
            </p>
          </div>
        )}

        {filtrados.map((p) => (
          <article key={p.id} className="personagem-card">
            <div className="personagem-actions">
              <button
                className="btn-icon"
                title="Editar"
                onClick={() => onEditar(p)}
              >
                <i className="fa-solid fa-pen-to-square" />
              </button>
              <button
                className="btn-icon btn-icon-danger"
                title="Excluir"
                onClick={() => onExcluir(p.id)}
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>

            <div className="personagem-card-top">
              <div className="personagem-avatar">
                {p.foto_url ? (
                  <img src={getImagemUrl(p.foto_url)} alt={p.nome} />
                ) : (
                  p.nome?.charAt(0)?.toUpperCase() || "?"
                )}
              </div>
              <div className="personagem-info">
                <div className="personagem-nome">{p.nome}</div>
                <div className="personagem-anime">{p.anime}</div>
                <div className="personagem-meta">
                  <span className="personagem-meta-item">
                    <i className="fa-solid fa-location-dot" /> {p.localizacao || "Local não informado"}
                  </span>
                  <span className="personagem-meta-item">
                    <i className="fa-regular fa-clock" /> {formatarData(p.data_registro)}
                  </span>
                </div>
              </div>
            </div>

            <div className="personagem-stats">
              <div className="stat-item">
                <div className="stat-label">Poder</div>
                <div className="stat-bar">
                  <div
                    className="stat-fill stat-fill-poder"
                    style={{ width: `${Math.min(100, Number(p.poder) || 0)}%` }}
                  />
                </div>
                <div className="stat-value">{p.poder ?? "—"}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Ataque</div>
                <div className="stat-bar">
                  <div
                    className="stat-fill stat-fill-ataque"
                    style={{
                      width: `${Math.min(100, Number(p.ataque) || 0)}%`,
                    }}
                  />
                </div>
                <div className="stat-value">{p.ataque ?? "—"}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Defesa</div>
                <div className="stat-bar">
                  <div
                    className="stat-fill stat-fill-defesa"
                    style={{
                      width: `${Math.min(100, Number(p.defesa) || 0)}%`,
                    }}
                  />
                </div>
                <div className="stat-value">{p.defesa ?? "—"}</div>
              </div>
            </div>

            {p.observacoes && (
              <div className="personagem-obs">"{p.observacoes}"</div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default ListaPersonagens