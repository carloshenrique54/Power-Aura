# Power Aura

Portal de Caçapava para cadastro de personagens e gerenciamento do Torneio de Poder.

## Banco de dados

O projeto usa as tabelas já existentes `personagens`, `confrontos` e `votacoes_favorito` do Supabase. Não há criação de tabelas nem configuração de RLS no código.

O projeto espera as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no arquivo `.env`.

## Executar

```bash
npm install
npm run dev
```

Na aba **Torneio**, gere e confirme uma batalha para registrar o confronto. A tela **Confrontos e ranking** oferece busca por personagem, ranking por vitórias, gráfico, votação popular e exportação CSV.
