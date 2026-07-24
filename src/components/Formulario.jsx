import { useState, useEffect, useRef } from "react"
import { supabase } from "../services/supabase.jsx"

const camposVazios = {
  nome: "",
  anime: "",
  localizacao: "",
  data_registro: "",
  poder: "0",
  ataque: "0",
  defesa: "0",
  observacoes: "",
}

function Formulario({ onSalvar, editando, onCancelarEdicao, mostrarToast }) {
  const [form, setForm] = useState({ ...camposVazios })
  const [arquivo, setArquivo] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const nomeRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (editando) {
      setForm({
        nome: editando.nome || "",
        anime: editando.anime || "",
        localizacao: editando.localizacao || "",
        data_registro: editando.data_registro
          ? editando.data_registro.slice(0, 10)
          : "",
        poder: editando.poder ?? 0,
        ataque: editando.ataque ?? 0,
        defesa: editando.defesa ?? 0,
        observacoes: editando.observacoes || "",
      })
      setArquivo(null)
      if (editando.foto_url) {
        const { data } = supabase.storage
          .from("Imagem")
          .getPublicUrl(editando.foto_url)
        setPreviewUrl(data?.publicUrl || null)
      } else {
        setPreviewUrl(null)
      }
      nomeRef.current?.focus()
    }
  }, [editando])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivo(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function limpar() {
    setForm({ ...camposVazios })
    setArquivo(null)
    setPreviewUrl(null)
    if (fileRef.current) fileRef.current.value = ""
    if (onCancelarEdicao) onCancelarEdicao()
  }

  async function uploadImagem(file) {
    const ext = file.name.split(".").pop()
    const nomeArquivo = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("Imagem")
      .upload(nomeArquivo, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (error) {
      console.error("Erro no upload da imagem:", error)
      if (mostrarToast) {
        mostrarToast(`Erro ao enviar foto no bucket Imagem: ${error.message}`, "erro")
      }
      return null
    }
    return nomeArquivo
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    if (salvando) return
    if (!form.nome.trim() || !form.anime.trim()) return

    setSalvando(true)

    try {
      let nomeFoto = editando?.foto_url || null

      if (arquivo) {
        const nomeUpload = await uploadImagem(arquivo)
        if (nomeUpload) {
          nomeFoto = nomeUpload
        }
      }

      const dados = {
        nome: form.nome.trim(),
        anime: form.anime.trim(),
        localizacao: form.localizacao.trim() || "Não informada",
        data_registro: form.data_registro
          ? new Date(form.data_registro).toISOString()
          : new Date().toISOString(),
        poder: Number(form.poder) || 0,
        ataque: Number(form.ataque) || 0,
        defesa: Number(form.defesa) || 0,
        observacoes: form.observacoes.trim() || null,
        foto_url: nomeFoto,
      }

      const sucesso = await onSalvar(dados, editando?.id)
      if (sucesso) {
        limpar()
      }
    } catch (err) {
      console.error("Erro no submit:", err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="panel-formulario">
      <div className="panel-header">
        <h2 className="panel-title">
          {editando ? "Editar Personagem" : "Registrar Avistamento"}
        </h2>
        <p className="panel-desc">
          {editando
            ? "Atualize os dados do personagem selecionado"
            : "Preencha os dados do personagem avistado na cidade"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-scroll">
        <div className="form-group">
          <label className="form-label">Nome do Personagem *</label>
          <input
            ref={nomeRef}
            type="text"
            name="nome"
            className="form-input"
            placeholder="Ex: Monkey D. Luffy"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Anime de Origem *</label>
          <input
            type="text"
            name="anime"
            className="form-input"
            placeholder="Ex: One Piece"
            value={form.anime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Local Avistado</label>
          <input
            type="text"
            name="localizacao"
            className="form-input"
            placeholder="Ex: Praça Central, Rua das Flores"
            value={form.localizacao}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Data do Registro</label>
          <input
            type="date"
            name="data_registro"
            className="form-input"
            value={form.data_registro}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Poder</label>
            <input
              type="number"
              name="poder"
              className="form-input"
              placeholder="0-100"
              min="0"
              max="100"
              value={form.poder}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ataque</label>
            <input
              type="number"
              name="ataque"
              className="form-input"
              placeholder="0-100"
              min="0"
              max="100"
              value={form.ataque}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Defesa</label>
            <input
              type="number"
              name="defesa"
              className="form-input"
              placeholder="0-100"
              min="0"
              max="100"
              value={form.defesa}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Foto do Personagem</label>
          <div
            className="form-foto-area"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="form-foto-preview" />
            ) : null}
            <p className="form-foto-label">
              <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: 6 }} />
              <span>Clique para selecionar</span> uma imagem
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Observações</label>
          <textarea
            name="observacoes"
            className="form-input"
            placeholder="Habilidades especiais, comportamento, condição..."
            value={form.observacoes}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="form-footer" style={{ padding: "16px 0 0 0", borderTop: "none" }}>
          {editando && (
            <button type="button" className="btn-secondary" onClick={limpar}>
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={salvando || !form.nome.trim() || !form.anime.trim()}
          >
            {salvando
              ? "Salvando..."
              : editando
                ? "Atualizar Registro"
                : "Registrar Avistamento"}
          </button>
        </div>
      </form>
    </section>
  )
}

export default Formulario
