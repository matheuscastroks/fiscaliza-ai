# Referências e Evidências para Publicação

Guia de consulta rápida para fundamentar descrições técnicas, metodológicas e empíricas sobre o Fiscaliza aí em publicações acadêmicas ou relatórios técnicos.

## 1. Mapa de Fontes por Tópico

| Tópico | Documentos primários no repositório |
| --- | --- |
| **Propósito, pilares e escopo do produto** | [PRODUCT.md](../../PRODUCT.md) |
| **Arquitetura técnica e fluxo de dados** | [arquitetura.md](../arquitetura.md), [decisoes.md](../decisoes.md) |
| **Integração 1746/DATA.RIO e SIURB/IPP** | [fontes-de-dados.md](../fontes-de-dados.md), [rio1746-diagnostico.md](../integracoes/rio1746-diagnostico.md), [20-siurb-fontes.md](../historico/evidencias/20-siurb-fontes.md) |
| **Sistema visual, UX e linguagem simples** | [front/DESIGN.md](../../front/DESIGN.md), [ux-justificativa-telas.md](../ux-justificativa-telas.md), [ux-writing.md](../ux-writing.md) |
| **Cobertura espacial do mapa e paginação** | [42-revisao-geral-pendencias.md](../historico/planos/42-revisao-geral-pendencias.md), [26-paginacao-busca-cache.md](../historico/evidencias/26-paginacao-busca-cache.md) |
| **Desempenho e auditoria de consultas** | [2026-10-20-auditoria-desempenho.md](../historico/relatorios/2026-10-20-auditoria-desempenho.md), [2026-11-10-backend-fase2.md](../historico/evidencias/2026-11-10-backend-fase2.md) |
| **Validação de backend, segurança e aparelho** | [40-quadro-final-plano.md](../historico/planos/40-quadro-final-plano.md), [41-revisao-backend-infra.md](../historico/planos/41-revisao-backend-infra.md), [evidencias/](../historico/evidencias/) |

## 2. Separação de Níveis de Evidência

Ao citar resultados deste repositório, mantenha a distinção explícita entre:
- **Código / testes automatizados:** executados via Node (`node --test`), Jest + React Native Testing Library, TypeScript (`tsc --noEmit`) e `expo lint`.
- **Banco local isolado:** testes de integração Fastify + PostgreSQL 17 em banco terminado em `_test`.
- **Dispositivo físico Android:** verificações manuais e inspeção de interface documentadas em `docs/historico/evidencias/` e `40-quadro-final-plano.md`.
- **Produção:** checagens registradas em `41-revisao-backend-infra.md` e `2026-11-13-fase0-producao.md`.

Não atribua ganhos de desempenho, métricas de usabilidade com moradores ou funcionamento em produção sem registro correspondente nesses documentos.

## 3. Cuidados Pré-Publicação

> [!WARNING]
> **Ilustrações locais (`front/assets/illustrations/`):** o pacote gratuito de origem não possui arquivo formal de licença ou autoria identificável (ver [front/assets/illustrations/README.md](../../front/assets/illustrations/README.md)). Evite reproduzir essas ilustrações diretamente em figuras de artigos sem confirmação de direitos de uso.

- **Capturas de tela:** nunca publique capturas armazenadas localmente em `.validation/` sem revisar e ocultar eventuais notificações ou dados pessoais do aparelho.
- **Atribuição de dados públicos:** ao exibir mapas ou estatísticas do SIURB/IPP, cite a fonte oficial (*Instituto Pereira Passos / Prefeitura da Cidade do Rio de Janeiro — CC BY 4.0*) e, para demandas urbanas, *Central 1746 / DATA.RIO*.
