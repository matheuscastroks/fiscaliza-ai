# Fiscaliza-AI: participação integrada

Plano aprovado na conversa de 17/10/2026. Substitui decisões anteriores de execução exclusivamente mockada.

## Produto e experiência
Plataforma de participação urbana: cidadão, território e gestão. App Expo Android/iOS, painel React/Vite separado, API Fastify TypeScript e PostgreSQL/Drizzle em Docker. Gemini apenas no servidor. Interface cívica humana e territorial; informações acadêmicas somente em Sobre e controles de apresentação.

Navegação: Início, Território, Participar, Acompanhar; menu secundário para perfil, resultados, ajuda, preferências e Sobre. Preservar mapa nativo e lista acessível. Registrar ocorrência, propor melhoria, responder consulta e acompanhar ação são jornadas distintas.

## Contrato de implementação
`shared/contracts.ts` define DTOs públicos. Todas respostas HTTP usam `{success,data?,error?}`. Base `/api`. Identidade deriva da sessão. Apoios e acompanhamentos são idempotentes. Transições exigem justificativa e histórico acrescentado pelo servidor. Apoios não determinam prioridade.

## Etapas
1. Contratos, produto, instruções e infraestrutura.
2. Backend persistente, autenticação e ciclo cidadão/gestão/retorno.
3. App integrado e participação: propostas, consultas, ações e indicadores.
4. Painel municipal próprio e assistência Gemini.
5. Testes, builds, revisão independente e documentação operacional.

## Aceite
Mesmo registro criado no app aparece no painel; resposta e conclusão aparecem no app. Apoio não duplica após remontar. Consulta encerrada rejeita respostas. Decisão municipal e evidências persistem após reiniciar. Offline conserva rascunho sem afirmar envio. Validar permissões, sessão, anexos, fallback IA e acessibilidade.

## Limites
Sem GOV.BR, orçamento participativo, chat, push ou publicação automática. Banco com um município fictício, contas próprias de apresentação e reset restrito a administrador. Hospedagem preparada, não publicada nesta execução. Não importar silenciosamente dados antigos do AsyncStorage para o servidor.
