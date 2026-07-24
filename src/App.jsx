import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "./services/supabase.jsx"
import "./App.css"

import Header from "./components/Header"
import ListaPersonagens from "./components/Lista"
import Formulario from "./components/Formulario"

function App() {
  const [personagens, setPersonagens] = useState([])
  const [busca, setBusca] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [editando, setEditando] = useState(null)
  const [toast, setToast] = useState(null)

  function mostrarToast(mensagem, tipo = "sucesso") {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 5000)
  }

  const buscarPersonagens = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    const { data, error } = await supabase
      .from("personagens")
      .select("*")
      .order("data_registro", { ascending: false })

    if (error) {
      console.error("Erro ao buscar personagens:", error)
      setErro(`Erro ao carregar dados: ${error.message}`)
      setCarregando(false)
      return
    }
    setPersonagens(data || [])
    setCarregando(false)
  }, [])

  useEffect(() => {
    buscarPersonagens()
  }, [buscarPersonagens])

  async function salvarPersonagem(dados, idEdicao) {
    if (idEdicao) {
      const { error } = await supabase
        .from("personagens")
        .update(dados)
        .eq("id", idEdicao)

      if (error) {
        console.error("Erro no update no Supabase:", error)
        mostrarToast(`Erro ao atualizar: ${error.message}`, "erro")
        return false
      }
      mostrarToast("Personagem atualizado com sucesso!")
      setEditando(null)
      await buscarPersonagens()
      return true
    } else {
      const { error } = await supabase.from("personagens").insert([dados])

      if (error) {
        console.error("Erro no insert no Supabase:", error)
        mostrarToast(`Erro ao cadastrar: ${error.message}`, "erro")
        return false
      }
      mostrarToast("Personagem registrado com sucesso!")
      await buscarPersonagens()
      return true
    }
  }

  async function excluirPersonagem(id) {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return

    const { error } = await supabase
      .from("personagens")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao deletar:", error)
      mostrarToast(`Erro ao excluir: ${error.message}`, "erro")
      return
    }
    mostrarToast("Registro excluído com sucesso.")
    if (editando?.id === id) setEditando(null)
    buscarPersonagens()
  }

  const totalAvistamentos = personagens.length
  const animesUnicos = useMemo(
    () => new Set(personagens.map((p) => p.anime).filter(Boolean)).size,
    [personagens]
  )

  return (
    <>
      <Header
        totalAvistamentos={totalAvistamentos}
        animesUnicos={animesUnicos}
      />

      <div className="main-layout">
        <ListaPersonagens
          personagens={personagens}
          busca={busca}
          setBusca={setBusca}
          carregando={carregando}
          erro={erro}
          onEditar={setEditando}
          onExcluir={excluirPersonagem}
        />

        <Formulario
          onSalvar={salvarPersonagem}
          editando={editando}
          onCancelarEdicao={() => setEditando(null)}
          mostrarToast={mostrarToast}
        />
      </div>

      {toast && (
        <div className={`toast toast-${toast.tipo}`}>{toast.mensagem}</div>
      )}
    </>
  )
}

export default App
