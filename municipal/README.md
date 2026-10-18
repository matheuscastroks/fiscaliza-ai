# Painel municipal

React, TypeScript e Vite. Os DTOs vêm de `../shared/contracts.ts`. Não há dados fictícios no cliente: as listas, decisões, sessões e anexos vêm da API.

## Executar

Na pasta `municipal`, execute `npm install` e `npm run dev`. O Vite atende na porta 5173 e encaminha `/api` para `http://localhost:3001`. Inicie também a API e o PostgreSQL seguindo a documentação da raiz. Entre com uma conta própria de equipe ou administrador; credenciais não são preenchidas pelo painel.

`npm run typecheck`, `npm test` e `npm run build` validam tipos, regras locais de transição/busca e o build. Esses comandos não substituem a verificação do ciclo completo com API e banco ativos.

O Dockerfile usa a raiz do repositório como contexto: `docker build -f municipal/Dockerfile .`. O nginx serve a SPA e encaminha `/api` para o serviço `api:3001`. Em produção, use HTTPS na entrada e configure `WEB_ORIGINS` na API para a origem pública exata (a API valida Origin nas mutações e emite cookie Secure). Anexos são enviados antes de serem associados a um registro e persistem no volume da API.

## Fluxos

Fila com busca e filtros combinados, histórico de atores, resposta pública, encaminhamento justificado e reabertura. Propostas com decisão e criação de ação vinculada. Consultas com opções, prazo, contagem e devolutiva. Ações com progresso, prazo, atualizações e evidências. Território mostra a distribuição real por bairro em tabela acessível.

Consultas e ações podem abranger todo o município, um bairro ou um local específico. A criação e a atualização permitem informar essa abrangência; um local exige bairro e coordenadas reais, com endereço opcional. O painel preserva a abrangência de propostas ao criar ações vinculadas. A API valida as coordenadas no polígono do município autorizado pela sessão.

A sessão é hidratada por `/api/auth/me`, mantida por cookie HTTP-only e enviada com `credentials: include`. O token de login não é armazenado. O painel bloqueia contas de cidadão e contas de gestão sem município autorizado. O nome e a UF vêm da sessão; não há seletor de município ou consulta de CEP para conceder acesso. A API continua sendo a autoridade nas operações e no isolamento territorial dos dados. Os dados são relidos após gravação, ao voltar à janela e pelo botão Atualizar. Os campos ficam preservados se a gravação falhar.

Sobre concentra a identificação acadêmica. Controles de apresentação aparecem somente para administrador, com confirmação textual antes da restauração.
