# Fiscaliza Aí — Descobrir, fiscalizar e agir no Rio

Aplicativo independente que ajuda moradores do Rio de Janeiro (IBGE 3304557) a descobrir o que acontece no bairro, acompanhar a atuação da prefeitura e encontrar como agir. Utiliza demandas do 1746 e cadastros de serviços públicos como apoio à fiscalização e à participação cidadã, com origem e cobertura explícitas. Não representa a prefeitura nem abre chamados no 1746.

Aplicativo Expo Android/iOS e API Fastify/PostgreSQL. Consulte [PRODUCT.md](PRODUCT.md) para escopo e limites de interpretação.

Na Home, escolha um bairro ou consulte chamados a 500 m, 1 km, 2 km ou 5 km de um ponto. A localização só é solicitada pelo botão correspondente; Casa, Trabalho e outros lugares ficam no aparelho, com endereço/referência e ponto confirmado no mapa ou por coordenadas. Não há autocomplete de endereços nessa versão. O raio é calculado na API antes da paginação; chamados sem coordenadas continuam acessíveis por bairro. Implementação e validação em [evidências do entorno](plan/evidence/2026-11-06-home-entorno-configuravel.md).

CI, merge automático das suas branches e ativação das proteções: [.github/README.md](.github/README.md). A release publica somente a API; instruções de VPS em [deploy/README.md](deploy/README.md).

## Organização

- `front/`: aplicativo Expo; rotas em `app/`, jornadas em `features/`, UI em `components/` e tokens em `theme/`.
- `front/tests/` e `front/scripts/`: testes e ferramentas do aplicativo.
- [front/DESIGN.md](front/DESIGN.md) e `front/.impeccable/`: sistema visual e seus metadados.
- `front/.agents/skills/`: skills Expo; orientações locais em [front/AGENTS.md](front/AGENTS.md).
- `package.json` da raiz: atalhos para instalar e executar os dois projetos, sem workspaces ou dependências próprias.
- `back/`: API Fastify, PostgreSQL (Drizzle ORM), migrações e sincronizador BigQuery DATA.RIO.
- `back/src/integrations/rio1746/`: pipeline de ingestão, sanitização e sincronização da Central 1746.
- `shared/`: contratos públicos TypeScript e helpers territoriais.
- `docs/integracoes/`: documentação e diagnósticos técnicos da base de dados do BigQuery.

## Integração DATA.RIO & Central 1746 (BigQuery)

O Fiscaliza Aí conecta-se diretamente ao repositório público do DATA.RIO no Google BigQuery:
- **Tabela de chamados**: `datario.adm_central_atendimento_1746.chamado`
- **Tabela de bairros**: `datario.dados_mestres.bairro`

### Princípios da Integração
1. **Desacoplamento**: O aplicativo móvel nunca consulta o BigQuery diretamente. Todas as leituras passam pelo PostgreSQL sincronizado.
2. **Controle de Custos e Particionamento**: Todas as consultas ao BigQuery são limitadas por partição diária (`data_particao`), compartilham um orçamento por execução (500 MB por padrão), executam dry runs e definem maximumBytesBilled pelo saldo disponível.
3. **Privacidade e Proteção de Dados**: Número de logradouro residencial é omitido da API pública; a base não contém dados pessoais identificáveis (CPF/nome).
4. **Resiliência Espacial**: Coordenadas geográficas fora do polígono do município do Rio de Janeiro ou inválidas (0,0) são tratadas com segurança mantendo o registro oficial acessível por bairro/região.

### Sincronização CLI

Para executar uma sincronização pontual de partição a partir do BigQuery para o PostgreSQL local:

```powershell
# Data explícita e limite de registros; confira a CLI antes de executar em produção.
npm run sync:rio1746 --prefix back -- 2026-09-20 2000
```

Consulte [docs/integracoes/rio1746-diagnostico.md](docs/integracoes/rio1746-diagnostico.md) para a análise detalhada da estrutura da tabela e métricas de volume.

## Desenvolvimento

Requer Node 22.18+ e npm. Preserve os lockfiles.

```powershell
npm run install:all
Copy-Item .env.compose.example .env.compose
# Configure senhas e origens permitidas em .env.compose.
docker compose --env-file .env.compose up --build
```

API: `http://localhost:3001/api`. O container aplica migrações antes de iniciar a API, sem criar contas ou dados de exemplo. Volumes preservam banco e anexos. Não use `docker compose down -v` para atualizar os serviços, pois remove os dados.

### Acesso e criação de conta

O login oferece e-mail/senha e acesso a `Criar conta`. O cadastro usa
`POST /api/auth/register` com `name`, `email` e `password` (8 a 128 caracteres).
A API cria exclusivamente uma conta cidadã, inicia a sessão e retorna HTTP 201;
e-mail já cadastrado retorna 409. Nome e e-mail são normalizados no servidor.
O município é confirmado posteriormente pelo fluxo de CEP, sem aceitar papel
ou município arbitrários no cadastro. O acesso com gov.br permanece desabilitado.

Não há conta de teste pré-criada. O cadastro cria exclusivamente contas cidadãs.

A pasta `Cadastro de conta` em `postman/fiscaliza.collection.json` verifica cadastro,
sessão, login, duplicidade, senha inválida e rejeição de privilégios e origem.
Execute somente contra um banco isolado de validação, pois cria uma conta:

```powershell
postman collection run postman/fiscaliza.collection.json -i "Cadastro de conta" --env-var "baseUrl=http://localhost:3001/api" --no-report-events
```

Com PostgreSQL já iniciado, defina `DATABASE_URL` no ambiente do processo:
```powershell
npm run migrate --prefix back
npm start --prefix back
```

Para autenticação com o BigQuery durante o desenvolvimento local:
```powershell
gcloud auth application-default login
$env:GCP_PROJECT_ID="seu-projeto-de-faturamento"
```

Copie `front/.env.example` para `front/.env`, configure `EXPO_PUBLIC_API_URL` e execute `npm start` pela raiz. No aparelho, use um endereço de API acessível pela rede local; `localhost` aponta para o próprio aparelho.

Os dois lockfiles ficam em `front/` e `back/`. Use `npm run install:all` ou `npm ci --prefix front` e `npm ci --prefix back`; não execute `npm ci` na raiz. Para comandos diretos do Expo, entre em `front/`. Argumentos do Metro também podem ser passados pela raiz: `npm start -- --clear`.

- `npm run android` / `npm run ios`: build nativo do app, com SDK e ferramentas da plataforma configurados.
- `npm run api:start`: iniciar a API local.
- `npm run config:prebuild`: conferir a configuração Expo.
- `npm run export:android --prefix front -- --output-dir ../.validation/android-bundle`: conferir o bundle Android sem gerar um APK.

Projetos nativos gerados devem ficar em `front/android/` e `front/ios/`, ignorados pelo Git. Antes de regenerar, preserve eventuais ajustes locais de projetos antigos. Esta reorganização não muda os identificadores do app, as rotas ou os dados salvos.

## Testes e Verificação

- `npm test`: testes unitários e de integração locais Node.
- `npm run typecheck`: verificação estrita de tipos do app e da API.
- `npm run typecheck --prefix front`: tipos somente do app.
- `npm run lint`: linter oficial Expo.
- `npm test --prefix back`: suite de testes do backend Fastify e integração BigQuery/1746.
- `npm run typecheck --prefix back`: verificação de tipos do backend.

### Paginação dos chamados oficiais

`GET /api/rio1746/calls?limit=50` preserva a resposta completa e o total. A resposta também inclui `nextCursor`. Para continuar, envie esse cursor com os mesmos filtros e `includeTotal=false`: a API retorna apenas a próxima página, com `total=null`, sem repetir a contagem. O cliente conserva o total da primeira página. Cursor de outro recorte ou combinado com `page>1` retorna HTTP 400. A paginação antiga por `page` continua disponível.

A migração `0012` habilita `pg_trgm` e cria índices de busca e ordenação. Em instalações grandes, programe uma janela para a migração transacional, que pode bloquear escritas durante a construção dos índices. O usuário do banco precisa de permissão para instalar a extensão. Não execute testes de integração no banco pessoal.

## Cadastros territoriais SIURB

Use PostgreSQL UTF-8. Aplique migrações no banco escolhido antes de importar. Não use o banco pessoal para testes. A instalação não cria contas ou dados de exemplo; contas existentes são preservadas.

```powershell
npm run probe:siurb --prefix back
# Após definir DATABASE_URL explicitamente e aplicar migrações:
npm run sync:siurb --prefix back -- all
# all importa limites 18 antes de escolas 1, saúde 2 e espaços 16.
```

O probe lê metadados e amostras; não equivale à extração integral. A importação é administrativa e nunca ocorre como efeito do build ou navegação. Fontes ausentes, cadastros sem nome e bairros sem vínculo são apresentados como tal. Consulte [integração SIURB](back/src/integrations/siurb/README.md) para limites, codificação e recuperação e [evidência das fontes](plan/evidence/20-siurb-fontes.md) para licença e contagens reais.

Leituras públicas: /api/data-sources, /api/public-facilities (paginado), /api/territorial-boundaries e seus detalhes, /api/neighborhoods/:id/overview?startDate=AAAA-MM-DD&endDate=AAAA-MM-DD. O OpenAPI gerado com npm run openapi --prefix back documenta os schemas e é publicado como artefato de validação no CI.

### Atualizar a API durante testes no Expo Go

O Metro atualiza o aplicativo Expo; ele não recompila a API que está em Docker. Após mudanças no backend, atualize somente esse serviço usando o mesmo arquivo de ambiente da instalação:

```powershell
docker compose --env-file .env.compose up -d --build --no-deps api
# Na primeira disponibilização dos cadastros:
docker compose --env-file .env.compose exec api node dist/back/src/siurb-cli.js all
```

A inicialização aplica migrações, sem criar contas ou dados de exemplo. Não use down -v para atualizar. GET /api/data-sources e as consultas /api/public-facilities devem responder sem login; HTTP 401 nessas rotas pode indicar um serviço antigo. Verifique pelo endereço de API configurado no aparelho, não somente pela API isolada de validação.
