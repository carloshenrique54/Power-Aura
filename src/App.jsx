import { BrowserRouter, Route, Routes } from "react-router-dom"
import "./App.css"

import Header from "./components/Header"
import ListaPersonagens from "./pages/ListaPersonagens.jsx"
import Torneio from "./pages/Torneio.jsx"

function App() {
  return(
    <BrowserRouter>
      <Header/>
      <Routes>
        <Route path="/" element={<ListaPersonagens />}/>
        <Route path="/torneio" element={<Torneio />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
