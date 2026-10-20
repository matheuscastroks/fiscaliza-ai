# Fiscaliza aí — Plataforma de Inteligência Urbana do Rio de Janeiro

Plataforma inteligente de exploração e análise de dados públicos urbanos com foco no município do Rio de Janeiro (IBGE `3304557`). A aplicação agrega dados oficiais da Central 1746 (DATA.RIO via Google BigQuery), democratizando o acesso a informações públicas sobre chamados, serviços, prazos de atendimento, secretarias e distribuição territorial na cidade.

Aplicativo Expo Android/iOS/Web e API TypeScript/PostgreSQL. A plataforma integra os dados oficiais da Prefeitura do Rio com as camadas participativas existentes (propostas comunitárias, consultas e ações públicas).

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
2. **Controle de Custos e Particionamento**: Todas as consultas ao BigQuery são limitadas por partição diária (`data_particao`), possuem `maximumBytesBilled` restrito (500 MB) e executam dry runs prévios.
3. **Privacidade e Proteção de Dados**: Número de logradouro residencial é omitido da API pública; a base não contém dados pessoais identificáveis (CPF/nome).
4. **Resiliência Espacial**: Coordenadas geográficas fora do polígono do município do Rio de Janeiro ou inválidas (0,0) são tratadas com segurança mantendo o registro oficial acessível por bairro/região.

### Sincronização CLI

Para executar uma sincronização pontual de partição a partir do BigQuery para o PostgreSQL local:

```powershell
npm run sync:rio1746 --prefix backend
# Ou especificando data da partição e limite:
npm run sync:rio1746 --prefix backend 2026-09-20 2000
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
```

Copie `.env.example` para `.env`, configure `EXPO_PUBLIC_API_URL` e execute `npm start`.

## Testes e Verificação

- `npm test`: testes unitários e de integração locais Node.
- `npx tsc --noEmit`: verificação estrita de tipos TypeScript (app).
- `npm run lint`: linter oficial Expo.
- `npm test --prefix backend`: suite de testes do backend Fastify e integração BigQuery/1746.
- `npm run typecheck --prefix backend`: verificação de tipos do backend.
