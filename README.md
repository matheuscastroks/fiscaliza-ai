# Fiscaliza-AI — Sinalização & Registro Urbano

Protótipo acadêmico em React Native e Expo para identificação, registro e acompanhamento documental de problemas na via pública (pavimentação, iluminação pública e limpeza urbana).

> **Aviso de Escopo e Dados:**
> Este projeto opera exclusivamente como um **ambiente demonstrativo local**.
> - Não possui vínculo com órgãos públicos ou prefeituras reais.
> - Os dados de demonstração são ancorados no município fictício de **Vila Esperança**.
> - A persistência é realizada localmente no dispositivo via `@react-native-async-storage/async-storage`.
> - A triagem e sugestão automática de categorias e gravidade utiliza motor heurístico local offline (`demo/localAnalysis.ts`), sem envio de fotos para serviços externos de nuvem ou custos de infraestrutura.

---

## 1. Arquitetura e Diretrizes de Design (V2)

O aplicativo segue rigorosamente as diretrizes **Sinalização & Registro Urbano** documentadas em [DESIGN.md](DESIGN.md) e [ANTI_SLOP.md](ANTI_SLOP.md):
- **Superfície Territorial Centrada no Mapa:** O mapa nativo é a interface primária de exploração contextual das demandas do bairro.
- **Ficha de Ocorrência Documental:** Cada demanda contém código de protocolo, localização, situação, descrição factual e linha do tempo de tramitação com justificativas documentadas.
- **Design de Serviço Sem Efeitos Supérfluos:** Paleta mineral com azul utilitário (`#176287`) para navegação e foco; eliminação de sombras artificiais pesadas, botões em pílula generalizados, pódios e animações elásticas desnecessárias.
- **Transparência de Participação:** Gamificação sóbria e critérios transparentes de pontuação cívica documentados no app, sem promessas fictícias de privilégios em serviços públicos reais.

---

## 2. Estrutura do Repositório

```text
fiscaliza-ai/
├── app/                     # Rotas do Expo Router (File-based routing)
│   ├── (tabs)/              # Abas: Mapa, Registrar, Ocorrências, Perfil
│   │   ├── index.tsx        # Mapa territorial e filtros rápidos
│   │   ├── ReportScreen.tsx # Registro em 3 etapas documentais
│   │   ├── ProblemsListScreen.tsx # Lista pesquisável de ocorrências
│   │   └── ProfileScreen.tsx # Perfil e resumo de contribuições
│   ├── LoginScreen.tsx      # Entrada de serviço para a demonstração
│   ├── ProblemDetailsScreen.tsx # Ficha com linha do tempo de tramitação
│   ├── HistoryScreen.tsx    # Histórico de relatos do usuário
│   ├── RankingScreen.tsx    # Ranking comunitário demonstrativo
│   ├── PointsGuideScreen.tsx # Guia de critérios de pontuação cívica
│   └── SettingsScreen.tsx   # Alternância de cenários (registered, in_progress, resolved)
├── components/
│   ├── ui/                  # Primitivos de interface (AppText, AppButton, AppScreen, etc.)
│   ├── occurrences/         # Componentes de ocorrência (OccurrenceRow, OccurrenceTimeline, StatusText)
│   └── demo/                # Componentes demonstrativos (DemoNotice)
├── features/
│   ├── map/                 # Hooks de região e filtragem independente
│   ├── reports/             # Formulário em etapas e confirmação
│   └── participation/       # Regras de pontuação cívica e seletores
├── demo/                    # Repositório local, fixtures e testes automatizados
├── services/                # Camada de serviços e API local mockada
├── stores/                  # Gerenciamento de estado com Zustand
└── theme/                   # Tokens semânticos de cores, tipografia e espaçamento
```

---

## 3. Comandos Operacionais

Conforme estabelecido no guia operacional do projeto ([AGENTS.md](AGENTS.md)), utilize sempre o gerenciador `npm`:

| Tarefa | Comando | Descrição |
|---|---|---|
| **Instalação** | `npm install` | Instala as dependências do projeto mantendo `package-lock.json`. |
| **Testes Unitários** | `npm test` | Executa o test runner nativo do Node em `demo/*.test.ts`. |
| **Validação TypeScript** | `npx tsc --noEmit` | Checagem estrita de tipos sem emissão de arquivos. |
| **Linter** | `npm run lint` | Executa o linter oficial do Expo (`expo lint`). |
| **Iniciar Metro / Dev** | `npm start` | Inicia o bundler Metro para desenvolvimento. |
| **Configuração Expo** | `npx expo config --type prebuild` | Inspeciona a configuração dinâmica gerada pelo `app.config.js`. |

---

## 4. Cenários de Demonstração

Para facilitar testes acadêmicos e validações da banca, o aplicativo suporta alternância instantânea entre três cenários controlados na tela de Configurações:
1. `registered`: Ocorrência primária recém-recebida, aguardando triagem.
2. `in_progress`: Equipe técnica designada com histórico documentado de tramitação.
3. `resolved`: Reparo concluído e vistoriado na via pública.

---

## 5. Licença

Este projeto é desenvolvido para fins acadêmicos e educacionais sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
