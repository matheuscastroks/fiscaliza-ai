# Fiscaliza-AI — Guia do Agente de IA (AGENTS.md)

Este documento é a referência canônica para qualquer agente autônomo ou assistente de IA operando no repositório **Fiscaliza-AI**. Siga estritamente os comandos, restrições e diretrizes estabelecidos aqui.

---

## 1. Visão Geral do Projeto

O **Fiscaliza-AI** é um aplicativo mobile cívico para relato, triagem e acompanhamento de problemas urbanos (buracos na via, iluminação pública, acúmulo de lixo, esgoto a céu aberto, etc.).
- **Plataforma:** React Native com Expo (gerenciado via CNG / Continuous Native Generation).
- **Roteamento:** Expo Router (roteamento baseado no sistema de arquivos em `app/`).
- **Estado:** Zustand + persistência local via `@react-native-async-storage/async-storage`.
- **Mapas:** `react-native-maps` (Google Maps no Android e Apple Maps no iOS em ambiente de desenvolvimento).
- **Inteligência Artificial:** Google Gemini (multimodal via REST) para triagem e categorização de fotos/relatos, com fallback para heurística local offline.

---

## 2. Comandos Operacionais Críticos

Sempre utilize os comandos abaixo para validação e execução. Nunca invente flags ou scripts inexistentes.

| Tarefa | Comando | Observações |
|---|---|---|
| **Instalação** | `npm install` | **Não** use `yarn` ou `pnpm` (o repositório mantém `package-lock.json`). |
| **Testes Unitários** | `npm test` | Executa o test runner nativo do Node em `demo/*.test.ts`. Deve passar com **0 falhas**. |
| **Checagem de Tipos** | `npx tsc --noEmit` | Validação estrita do TypeScript sem emissão de arquivos. |
| **Linter** | `npm run lint` | Executa o `expo lint`. |
| **Iniciar Metro / Dev** | `npm start` | Inicia o bundler Metro (`expo start`). |
| **Build Android Local** | `npx expo run:android` | Gera e compila a variante nativa de desenvolvimento com chaves embutidas. |
| **Configuração Expo** | `npx expo config --type prebuild` | Inspeciona a configuração dinâmica gerada pelo `app.config.js`. |

---

## 3. Variáveis de Ambiente e Configurações Nativas

1. **Prefixo Obrigatório:** Variáveis de ambiente que precisam ser acessadas pelo código do aplicativo cliente **devem** começar com `EXPO_PUBLIC_` (ex: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GEMINI_API_KEY`).
2. **Template e Segurança:** Nunca versione arquivos `.env` ou `.env*.local`. Mantenha sempre o [`.env.example`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/.env.example) atualizado quando adicionar novas variáveis.
3. **Injeção Nativa:** A configuração nativa do Expo é estendida dinamicamente no [`app.config.js`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/app.config.js). Não tente gravar chaves diretamente no [`app.json`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/app.json).
4. **Pastas Nativas `/android` e `/ios`:** São efêmeras e geradas automaticamente pelo Expo Prebuild. **Nunca comite as pastas `/android` ou `/ios`** (regras garantidas no [`.gitignore`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/.gitignore)).

---

## 4. Filosofia de Design e Diretrizes Anti-AI-Slop

O projeto possui regras rigorosas de identidade visual e usabilidade descritas nos documentos `01_AUDITORIA_ANTI_SLOP.md` e `02_DESIGN_V2.md`. O agente deve respeitar o princípio **R-I-T-O**:

- **R — Razão:** Qual necessidade cívica/urbana este elemento resolve?
- **I — Informação:** Que dado concreto está sendo transmitido?
- **T — Tarefa:** Que ação do cidadão ou servidor está sendo facilitada?
- **O — Originalidade Funcional:** Por que a solução escolhida serve a um serviço urbano e não a um template SaaS genérico?

### Antipadrões Proibidos:
- ❌ **Não** use gradientes cosméticos roxo/azul/aurora, glassmorphism ou blur de fundo desnecessário.
- ❌ **Não** empilhe cards dentro de cards ou bento grids decorativos sem propósito hierárquico.
- ❌ **Não** utilize textos publicitários vazios ("Transformando comunidades", "Sua cidade inteligente").
- ❌ **Não** simule vínculos institucionais ou logins oficiais (como GOV.BR) que não existem no protótipo.
- ❌ **Não** use animações de entrada gratuitas (`entering`) dentro de componentes de mapa nativo (`<Marker>`), pois isso trava a renderização da surface view no Android.

---

## 5. Estrutura do Repositório e Sub-AGENTS

```text
fiscaliza-ai/
├── app/                  # Rotas do Expo Router (telas e navegação por abas)
├── assets/               # Imagens, ícones e fontes estáticas
├── components/           # Componentes visuais compartilhados
├── constants/            # Cores do tema, paletas e constantes de layout
├── data/                 # Tipos e dados mockados iniciais (mockData.ts)
├── demo/                 # Módulo de demonstração isolado e testes (vide demo/AGENTS.md)
├── hooks/                # Custom React Hooks
├── services/             # Camada de serviços: IA e API Mock (vide services/AGENTS.md)
├── stores/               # Gerenciamento de estado global com Zustand
├── app.config.js         # Configuração dinâmica do Expo (lê .env)
├── app.json              # Metadados base do Expo
└── package.json          # Dependências e scripts
```

### Sub-documentos de Direcionamento Específico:
- [**`demo/AGENTS.md`**](file:///C:/Users/Matheus/Projects/fiscaliza-ai/demo/AGENTS.md): Regras para manipulação do repositório de dados local, cenários de teste e isolamento de estado.
- [**`services/AGENTS.md`**](file:///C:/Users/Matheus/Projects/fiscaliza-ai/services/AGENTS.md): Regras para chamadas ao Google Gemini, Google Maps e política obrigatória de fallbacks defensivos.
