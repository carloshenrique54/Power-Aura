import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase.jsx";
import "../styles/torneio.css";

const hojeParaInput = () => {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  return agora.toISOString().slice(0, 10);
};

const getImagemUrl = (nomeArquivo) => {
  if (!nomeArquivo) return null;
  const { data } = supabase.storage.from("Imagem").getPublicUrl(nomeArquivo);
  return data?.publicUrl || null;
};

const formatarData = (valor) => {
  if (!valor) return "Não informada";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const calcularPoderTotal = (personagem) =>
  (Number(personagem?.poder) || 0) +
  (Number(personagem?.ataque) || 0) +
  (Number(personagem?.defesa) || 0);

const novoFormulario = () => ({
  personagem1Id: "",
  personagem2Id: "",
  local: "",
  dataHorario: hojeParaInput(),
  observacoes: "",
});

function Torneio() {
  const [personagens, setPersonagens] = useState([]);
  const [confrontos, setConfrontos] = useState([]);
  const [votos, setVotos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("batalha");
  const [busca, setBusca] = useState("");
  const [formulario, setFormulario] = useState(novoFormulario);
  const [batalha, setBatalha] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);

  const mostrarToast = useCallback((mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");
    const [personagensResposta, confrontosResposta, votosResposta] = await Promise.all([
      supabase.from("personagens").select("*").order("nome"),
      supabase.from("confrontos").select("*").order("data_horario", { ascending: false }),
      supabase.from("votacoes_favorito").select("personagem_id"),
    ]);

    if (personagensResposta.error) {
      setErro(`Não foi possível carregar os personagens: ${personagensResposta.error.message}`);
    } else {
      setPersonagens(personagensResposta.data || []);
    }

    if (confrontosResposta.error) {
      setErro((mensagem) => mensagem || `Não foi possível carregar os confrontos: ${confrontosResposta.error.message}`);
    } else {
      setConfrontos(confrontosResposta.data || []);
    }

    // A votação é um desafio extra: a tela continua utilizável mesmo antes da tabela ser criada.
    if (!votosResposta.error) setVotos(votosResposta.data || []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const personagensPorId = useMemo(
    () => new Map(personagens.map((personagem) => [String(personagem.id), personagem])),
    [personagens],
  );

  const ranking = useMemo(() => {
    const totais = new Map(personagens.map((p) => [String(p.id), { ...p, vitorias: 0, lutas: 0 }]));
    confrontos.forEach((confronto) => {
      const p1 = totais.get(String(confronto.personagem1_id));
      const p2 = totais.get(String(confronto.personagem2_id));
      const vencedor = totais.get(String(confronto.vencedor_id));
      if (p1) p1.lutas += 1;
      if (p2) p2.lutas += 1;
      if (vencedor) vencedor.vitorias += 1;
    });
    return [...totais.values()].sort((a, b) => b.vitorias - a.vitorias || b.lutas - a.lutas || a.nome.localeCompare(b.nome));
  }, [confrontos, personagens]);

  const maiorNumeroVitorias = Math.max(1, ...ranking.map((p) => p.vitorias));
  const votosPorPersonagem = useMemo(() => {
    const total = new Map();
    votos.forEach(({ personagem_id: personagemId }) => {
      total.set(String(personagemId), (total.get(String(personagemId)) || 0) + 1);
    });
    return total;
  }, [votos]);

  const confrontosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase();
    if (!termo) return confrontos;
    return confrontos.filter((confronto) => {
      const p1 = personagensPorId.get(String(confronto.personagem1_id));
      const p2 = personagensPorId.get(String(confronto.personagem2_id));
      return [p1?.nome, p2?.nome, confronto.local].some((valor) => valor?.toLocaleLowerCase().includes(termo));
    });
  }, [busca, confrontos, personagensPorId]);

  const alterarCampo = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
    if (batalha) setBatalha(null);
  };

  const gerarBatalha = (evento) => {
    evento.preventDefault();
    const p1 = personagensPorId.get(formulario.personagem1Id);
    const p2 = personagensPorId.get(formulario.personagem2Id);
    if (!p1 || !p2) return mostrarToast("Escolha os dois personagens para gerar a batalha.", "erro");
    if (p1.id === p2.id) return mostrarToast("Um personagem não pode enfrentar a si mesmo.", "erro");
    if (!formulario.local.trim() || !formulario.dataHorario) return mostrarToast("Informe o local e a data da batalha.", "erro");

    const pontuacao1 = calcularPoderTotal(p1) + Math.random() * 15;
    const pontuacao2 = calcularPoderTotal(p2) + Math.random() * 15;
    setBatalha({ p1, p2, vencedor: pontuacao1 >= pontuacao2 ? p1 : p2 });
  };

  const salvarConfronto = async () => {
    if (!batalha || salvando) return;
    setSalvando(true);
    const dados = {
      personagem1_id: batalha.p1.id,
      personagem2_id: batalha.p2.id,
      local: formulario.local.trim(),
      data_horario: new Date(`${formulario.dataHorario}T12:00:00`).toISOString(),
      vencedor_id: batalha.vencedor.id,
      observacoes: formulario.observacoes.trim() || null,
      data_registro: new Date().toISOString(),
    };
    const { error } = await supabase.from("confrontos").insert([dados]);
    setSalvando(false);
    if (error) return mostrarToast(`Não foi possível salvar o confronto: ${error.message}`, "erro");

    setFormulario(novoFormulario());
    setBatalha(null);
    await carregarDados();
    setAba("resultados");
    mostrarToast("Confronto salvo. O ranking foi atualizado!");
  };

  const votar = async (personagemId) => {
    const chave = "power-aura-identificador-voto";
    let identificador = localStorage.getItem(chave);
    if (!identificador) {
      identificador = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      localStorage.setItem(chave, identificador);
    }
    const { error } = await supabase.from("votacoes_favorito").insert([{ personagem_id: personagemId, identificador }]);
    if (error) {
      return mostrarToast(error.code === "23505" ? "Você já registrou seu voto nesta enquete." : `Não foi possível registrar o voto: ${error.message}`, "erro");
    }
    setVotos((anteriores) => [...anteriores, { personagem_id: personagemId }]);
    mostrarToast("Voto registrado para o Personagem Favorito da Cidade!");
  };

  const exportarCsv = () => {
    const linhas = [
      ["Posição", "Personagem", "Anime", "Vitórias", "Confrontos"],
      ...ranking.map((p, indice) => [indice + 1, p.nome, p.anime, p.vitorias, p.lutas]),
    ];
    const csv = linhas.map((linha) => linha.map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }));
    link.download = "ranking-power-aura.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (carregando) {
    return <div className="torneio-container"><div className="carregando"><div className="spinner" /><span className="carregando-text">Carregando o torneio...</span></div></div>;
  }

  if (personagens.length < 2 && !erro) {
    return <div className="torneio-container"><section className="setup-card estado-vazio"><i className="fa-solid fa-trophy" /><h1>Prepare a arena</h1><p>Cadastre pelo menos dois personagens para criar confrontos.</p><Link to="/" className="btn-primary">Cadastrar personagens</Link></section></div>;
  }

  return (
    <main className="torneio-container">
      <header className="torneio-header">
        <h1 className="torneio-title"><i className="fa-solid fa-trophy" /> Torneio de Poder</h1>
        <p className="torneio-subtitle">Registre as batalhas da cidade, acompanhe os resultados e descubra os maiores campeões.</p>
      </header>

      {erro && <div className="erro-msg erro-torneio">{erro}</div>}

      <div className="torneio-tabs" role="tablist" aria-label="Seções do torneio">
        <button className={aba === "batalha" ? "active" : ""} onClick={() => setAba("batalha")}><i className="fa-solid fa-swords" /> Gerar batalha</button>
        <button className={aba === "resultados" ? "active" : ""} onClick={() => setAba("resultados")}><i className="fa-solid fa-ranking-star" /> Confrontos e ranking</button>
      </div>

      {aba === "batalha" && (
        <section className="battle-layout">
          <form className="setup-card confronto-form" onSubmit={gerarBatalha}>
            <div className="setup-title"><i className="fa-solid fa-plus" /> Cadastrar novo confronto</div>
            <p className="form-hint">A batalha sorteia um vencedor pela força dos atributos. Você pode alterar o resultado antes de salvar.</p>
            <div className="form-fields-grid">
              <label className="form-group"><span className="form-label">Personagem 1 *</span><select name="personagem1Id" className="form-input" value={formulario.personagem1Id} onChange={alterarCampo} required><option value="">Selecione</option>{personagens.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.anime}</option>)}</select></label>
              <label className="form-group"><span className="form-label">Personagem 2 *</span><select name="personagem2Id" className="form-input" value={formulario.personagem2Id} onChange={alterarCampo} required><option value="">Selecione</option>{personagens.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.anime}</option>)}</select></label>
              <label className="form-group"><span className="form-label">Local do confronto *</span><input className="form-input" name="local" value={formulario.local} onChange={alterarCampo} placeholder="Ex.: Praça Central" required /></label>
              <label className="form-group"><span className="form-label">Data do confronto *</span><input className="form-input" type="date" name="dataHorario" value={formulario.dataHorario} onChange={alterarCampo} required /></label>
            </div>
            <label className="form-group"><span className="form-label">Observações</span><textarea className="form-input" name="observacoes" value={formulario.observacoes} onChange={alterarCampo} rows="3" placeholder="Habilidades usadas, público presente, detalhes da luta..." /></label>
            <button className="btn-primary" type="submit"><i className="fa-solid fa-bolt" /> Gerar batalha</button>
          </form>

          <section className="arena-card" aria-live="polite">
            {!batalha ? <div className="arena-placeholder"><i className="fa-solid fa-swords" /><h2>A arena aguarda</h2><p>Escolha dois personagens e gere uma batalha para ver o resultado.</p></div> : <>
              <div className="round-badge"><i className="fa-solid fa-fire" /> Resultado da batalha</div>
              <div className="confronto-container">
                {[batalha.p1, batalha.p2].map((lutador) => <article className={`lutador-card ${batalha.vencedor.id === lutador.id ? "vencedor" : ""}`} key={lutador.id}><div className="lutador-avatar">{lutador.foto_url ? <img src={getImagemUrl(lutador.foto_url)} alt={lutador.nome} /> : lutador.nome.charAt(0).toUpperCase()}</div><h2 className="lutador-nome">{lutador.nome}</h2><p className="lutador-anime">{lutador.anime}</p><div className="lutador-stats-grid"><div className="lutador-stat-row"><span>Poder</span><strong>{lutador.poder || 0}</strong></div><div className="lutador-stat-row"><span>Ataque</span><strong>{lutador.ataque || 0}</strong></div><div className="lutador-stat-row"><span>Defesa</span><strong>{lutador.defesa || 0}</strong></div><div className="lutador-stat-row total"><span>Total</span><strong>{calcularPoderTotal(lutador)}</strong></div></div><button type="button" className="btn-secondary" onClick={() => setBatalha((atual) => ({ ...atual, vencedor: lutador }))}>Escolher vencedor</button></article>)}
              </div>
              <div className="resultado-batalha"><i className="fa-solid fa-crown" /> Vitória de <strong>{batalha.vencedor.nome}</strong></div>
              <button className="btn-primary salvar-confronto" onClick={salvarConfronto} disabled={salvando}>{salvando ? "Salvando..." : "Confirmar e salvar confronto"}</button>
            </>}
          </section>
        </section>
      )}

      {aba === "resultados" && <section className="resultados-layout">
        <section className="setup-card ranking-card"><div className="card-heading"><div><h2>Ranking automático</h2><p>Uma vitória é adicionada a cada confronto salvo.</p></div><button className="btn-secondary" onClick={exportarCsv}><i className="fa-solid fa-file-csv" /> Exportar CSV</button></div><div className="ranking-list">{ranking.map((p, indice) => <div className="ranking-item" key={p.id}><span className="ranking-posicao">{indice + 1}</span><div className="ranking-nome"><strong>{p.nome}</strong><span>{p.anime}</span></div><strong className="ranking-vitorias">{p.vitorias} {p.vitorias === 1 ? "vitória" : "vitórias"}</strong></div>)}</div></section>
        <section className="setup-card historico-card"><div className="card-heading"><div><h2>Confrontos realizados</h2><p>{confrontos.length} {confrontos.length === 1 ? "registro" : "registros"} no banco de dados.</p></div></div><div className="search-wrapper"><i className="fa-solid fa-magnifying-glass search-icon" /><input className="search-input" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar por personagem ou local..." /></div><div className="historico-list">{confrontosFiltrados.length === 0 ? <p className="empty-text">Nenhum confronto encontrado.</p> : confrontosFiltrados.map((c) => { const p1 = personagensPorId.get(String(c.personagem1_id)); const p2 = personagensPorId.get(String(c.personagem2_id)); const vencedor = personagensPorId.get(String(c.vencedor_id)); return <article className="historico-item" key={c.id}><div><strong>{p1?.nome || "Personagem removido"} <span>vs</span> {p2?.nome || "Personagem removido"}</strong><p><i className="fa-solid fa-location-dot" /> {c.local} · <i className="fa-regular fa-clock" /> {formatarData(c.data_horario, true)}</p>{c.observacoes && <em>“{c.observacoes}”</em>}</div><div className="historico-vencedor"><span>Vencedor</span><strong>{vencedor?.nome || "Não definido"}</strong></div></article>; })}</div></section>
        <section className="setup-card extras-card"><div className="card-heading"><div><h2>Desafios extras</h2><p>Votação popular e gráfico de vitórias por personagem.</p></div></div><div className="extras-grid"><div><h3><i className="fa-solid fa-heart" /> Personagem Favorito da Cidade</h3><div className="votacao-list">{personagens.map((p) => <button className="voto-item" key={p.id} onClick={() => votar(p.id)}><span>{p.nome}</span><strong>{votosPorPersonagem.get(String(p.id)) || 0} <i className="fa-solid fa-heart" /></strong></button>)}</div></div><div><h3><i className="fa-solid fa-chart-column" /> Vitórias por personagem</h3><div className="grafico-list">{ranking.map((p) => <div className="grafico-item" key={p.id}><div><span>{p.nome}</span><strong>{p.vitorias}</strong></div><div className="grafico-trilho"><span style={{ width: `${(p.vitorias / maiorNumeroVitorias) * 100}%` }} /></div></div>)}</div></div></div></section>
      </section>}

      {toast && <div className={`toast toast-${toast.tipo}`}>{toast.mensagem}</div>}
    </main>
  );
}

export default Torneio;
