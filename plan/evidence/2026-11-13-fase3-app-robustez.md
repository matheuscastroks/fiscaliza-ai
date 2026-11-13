# Fase 3 da revisão geral — app: robustez, dados e registro de erros (13/11/2026)

Evidência: **C** = código e testes automatizados; **A** = aparelho. Nada desta fase foi visto no aparelho ainda: o Sentry e o `expo-network` são módulos nativos e pedem um build de desenvolvimento novo, que fica para depois de juntar a Fase 4.

| Item | O que mudou | Evidência |
| --- | --- | --- |
| Erro de tela | `ErrorBoundary` na raiz (`app/_layout.tsx`) com "Tentar de novo" (`ScreenErrorFallback`), em vez de o app fechar | C (typecheck) |
| Sentry no app | `@sentry/react-native` (8.28), plugin `@sentry/react-native/expo` (org `instituto-de-pesquisa-economic`, projeto `fiscaliza-ai`), `getSentryExpoConfig` no Metro, `Sentry.wrap` da raiz e integração de navegação. DSN em `EXPO_PUBLIC_SENTRY_DSN` (no `.env` local, fora do git). Em desenvolvimento só envia com `EXPO_PUBLIC_SENTRY_DEV=1`. Sem PII: só o id da conta | C |
| Sentry na API | `@sentry/node` com `SENTRY_DSN` (vazio = nada enviado): erros 5xx da API e falhas de tarefa do agendador, sem corpo, cookies, cabeçalhos nem IP; esvazia a fila ao encerrar. Variável repassada pelos dois Compose | C |
| Novas tentativas | As consultas só repetem falha de transporte (`NetworkError`), até 2 vezes; 404, 401 e 422 não repetem | C |
| Demora × sem internet | Prazo estourado diz "O servidor demorou para responder", não "Sem internet" | C |
| Foco e rede | `focusManager` (AppState) e `onlineManager` (`expo-network`) ligados uma vez: consultas pausam sem rede e se renovam ao reconectar ou voltar ao app. O `useFocusEffect` das telas continua: é o foco de navegação, que o `focusManager` não cobre | C |
| Cache offline | `PersistQueryClientProvider` com AsyncStorage (24 h), só para dados públicos (filtros, lista, detalhe, bairros, contornos, fontes): o app abre com conteúdo sem internet | C |
| Salvos pendentes | Mudanças feitas sem internet sobem ao reconectar ou ao voltar ao app, não só na próxima ação | C |
| Abertura | Com conta guardada, o app abre sem esperar `/auth/me` (até 15 s antes); a sessão é conferida em seguida e ignorada se a pessoa entrou ou saiu nesse meio-tempo. A animação de marca dura 3,5 s só na primeira abertura; depois, cerca de 1,5 s | C (teste: pronto antes da resposta da rede) |
| Toque no aviso | `useLastNotificationResponse` depois de as telas existirem: o toque que abre o app fechado não se perde | C |
| Cancelamento | Filtros e estado da sincronização recebem `signal` | C |

## Desvios do plano
- **Fábrica de chaves com município não foi feita.** As consultas do 1746 são só do Rio no servidor, e o cache inteiro é limpo ao trocar de conta ou município; as chaves continuam como estão.
- **Fonte única de "meu bairro" não foi feita.** Os componentes envolvidos (`NeighborhoodPicker`, `SideMenu`) mudaram na Fase 4; fica para depois da junção, para não conflitar.
- **Avisos do Reanimated:** não vêm do código do app (nenhum `useAnimatedStyle` com dependências). Saem de bibliotecas (bottom sheet ou teclado) e só aparecem em desenvolvimento; não foram corrigidos.
