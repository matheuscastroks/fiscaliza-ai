# Planejamento e evidências — Fiscaliza aí

Este diretório guarda decisões, planos e evidências. A fonte da verdade do produto é o [`PRODUCT.md`](../PRODUCT.md); as regras de trabalho estão no [`AGENTS.md`](../AGENTS.md). Quando um plano contradiz esses dois, valem os dois.

## Estado atual (novembro de 2026)

- **Revisão geral (13/11):** auditoria de backend, app e infraestrutura, com execução por fases. Evidências: [Fase 0 — produção](evidence/2026-11-13-fase0-producao.md), [Fase 1 — privacidade e legado](evidence/2026-11-13-fase1-privacidade.md), [Fase 2 — backend](evidence/2026-11-13-fase2-backend.md), [Fase 3 — app](evidence/2026-11-13-fase3-app-robustez.md), [Fase 4 — interface no aparelho](evidence/2026-11-13-fase4-interface-s22.md).
- **Backend e infraestrutura:** [41 — revisão de backend e infra](41-revisao-backend-infra.md).
- **Frontend:** [37 — plano de melhorias](37-plano-melhorias-frontend.md) e [40 — quadro final](40-quadro-final-plano.md).
- **UX:** [38 — justificativa por tela](38-justificativa-ux-telas.md) e [39 — guia de UX writing](39-guia-ux-writing.md).

## Decisões que continuam valendo

| Documento | Assunto |
| --- | --- |
| [12](12-municipio-por-cep.md) | Município vinculado à conta por CEP |
| [14](14-consolidacao-territorial.md) | Consolidação territorial (bairros, equipamentos) |
| [17](17-identidade-referencia.md) | Identidade visual de referência |
| [18](18-desktop-alinhado.md) | Desktop alinhado ao móvel |
| [19](19-onboarding-ilustrado.md) | Onboarding ilustrado |
| [36](36-contas-sem-administracao.md) | Contas sem papéis de administração |
| [Desempenho do mapa](map-performance.md) | Experimento reproduzível de abertura do mapa |
| [Dados dinâmicos](dynamic-data-performance.md) | Avaliação de dados dinâmicos |

Especificações e planos de implementação datados ficam em [`specs/`](specs/) e [`implementation/`](implementation/); as evidências, em [`evidence/`](evidence/).

## Arquivo

Os documentos em [`archive/`](archive/) descrevem fases encerradas: o protótipo com dados simulados, a participação cidadã (ocorrências, propostas, consultas, fotos com análise por IA) e o roteiro de demonstração. O app não tem mais essas funções; os documentos ficam só como histórico.
