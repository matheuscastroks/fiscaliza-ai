# Município vinculado por CEP

## Direção aprovada
O cidadão informa CEP no primeiro acesso, confirma o município encontrado e passa a participar nesse território. Pode atualizar o vínculo ao mudar de residência; registros antigos conservam município e autoria. Gestão pertence ao município autorizado pela conta e não pode trocá-lo pelo onboarding cidadão. CEP indica referência territorial, não comprova residência.

## Contrato
- `GET /api/profile/postal-code/:cep`: sessão autenticada; devolve `PostalCodeLookup` com `postalCode`, `municipality`, `neighborhood`, `street`.
- `PUT /api/profile/municipality`: cidadão envia `{postalCode, municipalityId}` para confirmar; servidor resolve CEP e verifica o código. Retorna `SessionUser` atualizado. Nenhum nome/bairro informado pelo cliente é autoridade.
- `SessionUser.municipality`: `Municipality | null`, com código IBGE, nome, UF, centro e limites de visualização. CEP e bairro no perfil.
- `GET /api/municipality`: município autorizado da sessão. Dados cívicos e painel limitados por município; identidade territorial não vem de query/body arbitrários.
- Ocorrências novas validam ponto contra polígono municipal no servidor. Indisponibilidade de consulta preserva rascunho e retorna erro; não aceita limites aproximados como substituto silencioso.

## Implementação
1. API: migração não destrutiva, perfil territorial, ViaCEP, malhas IBGE com cache, isolamento de dados, testes de fronteira/autorização e coleção Postman.
2. App: onboarding com consulta/confirmação, troca de CEP no perfil, cache/rascunhos por usuário e município, contexto e mapa dinâmicos.
3. Gestão: município da conta no cabeçalho e conteúdo, sem seletor livre.
4. Verificar testes, tipos, lint, builds e jornadas possíveis no navegador.

## Decisões
- Cenário de apresentação passa a usar Rio de Janeiro/RJ (3304557), coerente com as coordenadas existentes. Conteúdo continua fictício e identificado em Sobre; não representa integração oficial.
- Manter contas de apresentação compatíveis. Cidadãos sem vínculo entram no onboarding; contas de gestão recebem vínculo territorial no seed/migração.
- Não alterar/remover as exclusões de documentos históricos já presentes no checkout ao iniciar esta tarefa.
- Manter a branch atual. Commits organizados foram autorizados posteriormente pelo usuário; push não foi solicitado.

## Resultado
Implementação e revisão concluídas. Evidências atualizadas e limites de verificação em `13-validacao-municipal.md`.
