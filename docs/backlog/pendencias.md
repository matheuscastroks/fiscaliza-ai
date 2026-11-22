# Pendências Abertas (Backlog)

Consolidação das pendências reais extraídas da revisão geral (`docs/historico/planos/40`, `41` e `42`).

## 1. Ações Operacionais do Mantenedor

- Configurar credencial ativa do BigQuery (`secrets/bigquery.json`) e `GCP_PROJECT_ID` no ambiente de produção para retomar a sincronização periódica do 1746.
- Executar `eas init` e registrar o `projectId` do EAS para habilitar notificações push reais em produção.
- Configurar `SENTRY_DSN` da API e `SENTRY_AUTH_TOKEN` (secret EAS) quando desejado monitoramento remoto de erros.
- Configurar monitores externos (Healthchecks.io / UptimeRobot) para os pings já emitidos pelo agendador e backup, além de cópia externa periódica de `backups/`.
- Restringir no Google Cloud a chave Android antiga do Firebase e avaliar oportunamente a eventual troca do identificador de pacote (`com.anonymous.fiscalizaai`).

## 2. Melhorias Técnicas Futuras

- **Lista paginada de chamados sem rolagem infinita:** especificação pronta em [proposta-lista-chamados.md](proposta-lista-chamados.md) (ainda não implementada).
- **Refatoração incremental de componentes extensos (Fase 5):** dividir trechos restantes de `OfficialCallDetailsScreen` (controlador) e `useTerritoryView`, e migrar os testes `.cjs` remanescentes que leem código-fonte para testes comportamentais com Jest + RNTL.
- **Avaliação com moradores:** validar textos de interface (`docs/ux-writing.md`), contraste e fluidez em aparelhos Android de entrada com fonte ampliada.
