# Registro de execução — participação integrada

## Estado
- Base: `dd34ebf`; branch: `feat/participacao-urbana`.
- Fundação: contratos compartilhados, PRODUCT, DESIGN, guia de contribuição e infraestrutura implementados.
- API: Fastify/PostgreSQL, autenticação, participação, resposta institucional, imagens, assistência textual e cenários implementados.
- Cidadão: quatro abas, menu secundário, propostas, consultas, ações, resultados, acompanhamento, avaliação e rascunhos integrados.
- Gestão: painel separado com fila, propostas, consultas, ações, território e controles administrativos.
- Skills, CI, coleção Postman e documentação entregues. Evidências iniciais em `11-validacao-integrada.md`; atualização do onboarding municipal e pendências em `13-validacao-municipal.md`.

## Decisões de integração
| Interface | Decisão |
|---|---|
| Backend/App/Painel | `shared/contracts.ts`, envelope HTTP `/api`, banco como autoridade |
| Identidade | Sessão derivada no servidor; SecureStore nativo; cookies web distintos para cidadão e gestão |
| Fotos | Upload validado e convertido antes de vincular; sem URI temporária ou envio externo ao Gemini |
| Participação | Apoios/respostas únicos persistidos; histórico com ator e justificativa; popularidade não define prioridade |
| Falhas | Rascunho local, erro recuperável e distinção entre falha de gravação e falha de atualização |
| Proxy | Confiança explícita na rede privada do Compose; acesso direto não confia em cabeçalhos encaminhados |
| Produto | Autorização do plano integrado substitui o escopo anterior exclusivamente mockado |

## Coordenação e revisão
Auditorias de produto, mobile e dados precederam a implementação. Agentes implementaram API e painel com interfaces combinadas; revisores independentes avaliaram API, clientes e integração. Achados corrigidos incluem validação de imagem, paginação, justificativas, prioridade técnica, falha após POST confirmado, proxy, coexistência de sessões e CORS para participação web.

Execução no checkout atual em branch própria; nenhuma alteração na branch main, push ou publicação. Comandos PowerShell e este registro substituíram scripts Bash de coordenação incompatíveis com o ambiente. O plano da conversa foi a especificação aprovada.
