# Fiscaliza Aí — Descobrir, fiscalizar e agir no Rio

Aplicativo independente que ajuda moradores do Rio de Janeiro (IBGE 3304557) a descobrir o que acontece no bairro, acompanhar a atuação da prefeitura e encontrar como agir. Utiliza demandas do 1746 e cadastros de serviços públicos como apoio à fiscalização e à participação cidadã, com origem e cobertura explícitas. Não representa a prefeitura nem abre chamados no 1746.

Aplicativo Expo Android/iOS/web e API Fastify/PostgreSQL. Consulte [PRODUCT.md](PRODUCT.md) para escopo e limites de interpretação.

## Organização

- `app/`, `features/`, `components/` e `theme/`: aplicativo Expo (cidadão e mapas territoriais com clustering).
- `backend/`: API Fastify, PostgreSQL (Drizzle ORM), migrações e sincronizador BigQuery DATA.RIO.
- `backend/src/integrations/rio1746/`: pipeline de ingestão, sanitização e sincronização da Central 1746.
- `shared/`: contratos públicos TypeScript e helpers territoriais.
- `docs/integracoes/`: documentação e diagnósticos técnicos da base de dados do BigQuery.

## Integração DATA.RIO & Central 1746 (BigQuery)

O Fiscaliza Aí conecta-se diretamente ao repositório público do DATA.RIO no Google BigQuery:
- **Tabela de chamados**: `datario.adm_central_atendimento_1746.chamado`
- **Tabela de bairros**: `datario.dados_mestres.bairro`

### Princípios da Integração
1. **Desacoplamento**: O cliente mobile/web nunca consulta o BigQuery diretamente. Todas as leituras passam pelo PostgreSQL sincronizado.
2. **Controle de Custos e Particionamento**: Todas as consultas ao BigQuery são limitadas por partição diária (`data_particao`), compartilham um orçamento por execução (500 MB por padrão), executam dry runs e definem maximumBytesBilled pelo saldo disponível.
3. **Privacidade e Proteção de Dados**: Número de logradouro residencial é omitido da API pública; a base não contém dados pessoais identificáveis (CPF/nome).
4. **Resiliência Espacial**: Coordenadas geográficas fora do polígono do município do Rio de Janeiro ou inválidas (0,0) são tratadas com segurança mantendo o registro oficial acessível por bairro/região.

### Sincronização CLI

Para executar uma sincronização pontual de partição a partir do BigQuery para o PostgreSQL local:

```powershell
# Data explícita e limite de registros; confira a CLI antes de executar em produção.
npm run sync:rio1746 --prefix backend -- 2026-09-20 2000
```

Consulte [docs/integracoes/rio1746-diagnostico.md](docs/integracoes/rio1746-diagnostico.md) para a análise detalhada da estrutura da tabela e métricas de volume.

## Desenvolvimento

Requer Node 22.18+ e npm. Preserve os lockfiles.

```powershell
npm install
npm install --prefix backend
Copy-Item .env.compose.example .env.compose
# Configure senhas e origens permitidas em .env.compose.
docker compose --env-file .env.compose up --build
```

API: `http://localhost:3001/api`. Migrations e seed são executados antes da API no container. Volumes preservam banco e anexos. `docker compose down -v` remove os dados.

Com PostgreSQL já iniciado, defina `DATABASE_URL` e `DEMO_PASSWORD` no ambiente do processo:
```powershell
npm run migrate --prefix backend
npm run seed --prefix backend
npm start --prefix backend
```

Para autenticação com o BigQuery durante o desenvolvimento local:
```powershell
gcloud auth application-default login
$env:GCP_PROJECT_ID="seu-projeto-de-faturamento"
```

Copie `.env.example` para `.env`, configure `EXPO_PUBLIC_API_URL` e execute `npm start`.

## Testes e Verificação

- `npm test`: testes unitários e de integração locais Node.
- `npx tsc --noEmit`: verificação estrita de tipos TypeScript (app).
- `npm run lint`: linter oficial Expo.
- `npm test --prefix backend`: suite de testes do backend Fastify e integração BigQuery/1746.
- `npm run typecheck --prefix backend`: verificação de tipos do backend.

## Cadastros territoriais SIURB

Use PostgreSQL UTF-8. Aplique migrações no banco escolhido antes de importar. Não use o banco pessoal para testes. O seed de instalação preserva contas existentes; limpeza é uma operação separada e explícita.

```powershell
npm run probe:siurb --prefix backend
# Após definir DATABASE_URL explicitamente e aplicar migrações:
npm run sync:siurb --prefix backend -- all
# all importa limites 18 antes de escolas 1, saúde 2 e espaços 16.
```

O probe lê metadados e amostras; não equivale à extração integral. A importação é administrativa e nunca ocorre como efeito do build ou navegação. Fontes ausentes, cadastros sem nome e bairros sem vínculo são apresentados como tal. Consulte [integração SIURB](backend/src/integrations/siurb/README.md) para limites, codificação e recuperação e [evidência das fontes](plan/evidence/20-siurb-fontes.md) para licença e contagens reais.

Leituras públicas: /api/data-sources, /api/public-facilities (paginado), /api/territorial-boundaries e seus detalhes, /api/neighborhoods/:id/overview?startDate=AAAA-MM-DD&endDate=AAAA-MM-DD. O OpenAPI gerado com npm run openapi --prefix backend documenta os schemas e é publicado como artefato de validação no CI.

### Atualizar a API durante testes no Expo Go

O Metro atualiza o aplicativo Expo; ele não recompila a API que está em Docker. Após mudanças no backend, atualize somente esse serviço usando o mesmo arquivo de ambiente da instalação:

```powershell
docker compose --env-file .env.compose up -d --build --no-deps api
# Na primeira disponibilização dos cadastros:
docker compose --env-file .env.compose exec api node dist/backend/src/siurb-cli.js all
```

A inicialização aplica migrações e o seed de instalação preserva contas existentes. Não use down -v ou clean:demo para atualizar. GET /api/data-sources e as consultas /api/public-facilities devem responder sem login; HTTP 401 nessas rotas pode indicar um serviço antigo. Verifique pelo endereço de API configurado no aparelho, não somente pela API isolada de validação.
