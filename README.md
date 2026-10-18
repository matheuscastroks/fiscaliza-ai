# Fiscaliza-AI

Plataforma de participação na gestão urbana: cidadãos registram necessidades, propõem melhorias, participam de consultas e acompanham ações e respostas da gestão.

Aplicativo Expo Android/iOS, painel municipal React/Vite e API TypeScript/PostgreSQL. As cidades e seus limites são reais; os registros iniciais e contas são de apresentação acadêmica. Não existe vínculo ou encaminhamento a uma prefeitura real. Esse contexto fica em Sobre nas interfaces.

## Organização

`app/`, `features/`, `components/` e `theme/` compõem o cidadão; `backend/` contém API, migrações, dados territoriais e testes; `municipal/` contém o painel; `shared/` define contratos. `PRODUCT.md`, `DESIGN.md` e `AGENTS.md` orientam contribuições.

## Município pelo CEP

No primeiro acesso, o cidadão informa o CEP e confirma município/UF. O servidor consulta ViaCEP, usa o código IBGE como identidade municipal e valida a localização de novas ocorrências no polígono da cidade. Um ponto no retângulo de visualização do mapa não é suficiente para permitir o registro.

Meu perfil → Atualizar CEP e município permite mudança de residência. Rascunhos e cache são separados por usuário/município. O histórico das cidades anteriores é preservado para consulta; novas interações ficam na cidade atual. CEP não é comprovação de residência.

A gestão recebe município e setor pela conta autorizada, sem seleção livre no onboarding. Contas sem vínculo ficam bloqueadas. O cenário inicial usa Rio de Janeiro/RJ (3304557), coerente com o mapa. Para conhecê-lo como cidadão, use o CEP 20010-000 e confirme a cidade. A primeira consulta exige conexão; consultas válidas têm cache no servidor. A malha oficial do Rio acompanha o projeto.

## Desenvolvimento

Requer Node 22.18+ e npm. Preserve os três lockfiles.

```powershell
npm install
npm install --prefix backend
npm install --prefix municipal
Copy-Item .env.compose.example .env.compose
# Configure senhas e origens permitidas em .env.compose.
docker compose --env-file .env.compose up --build
```

Painel: http://localhost:8080. API: http://localhost:3001/api. Migrations e seed são executados antes da API no container. Volumes preservam banco e anexos. `docker compose down -v` remove os dados.

Com PostgreSQL já iniciado, defina DATABASE_URL e DEMO_PASSWORD no ambiente do processo. Execute `npm run migrate --prefix backend`, `npm run seed --prefix backend` e `npm start --prefix backend`. Em outro terminal: `npm run dev --prefix municipal`. Os arquivos backend/.env.example são modelos; não são carregados automaticamente.

Copie `.env.example` para `.env`, configure EXPO_PUBLIC_API_URL e execute `npm start`. No celular, localhost é o próprio aparelho: use o IP do computador na mesma rede. No Compose, acesso LAN exige API_BIND=0.0.0.0; acrescente em WEB_ORIGINS as origens web efetivamente usadas. Gemini nunca usa EXPO_PUBLIC_.

## Contas de apresentação

O seed mantém `beatrizarante@gmail.com` (cidadão), `gestao@vilaesperanca.exemplo` (gestão) e `admin@vilaesperanca.exemplo` (admin). A gestão pertence ao Rio; a cidadã confirma seu município no onboarding.

A senha é DEMO_PASSWORD. O padrão Fiscaliza123! existe apenas no desenvolvimento sem configuração; produção exige valor explícito. O seed não troca senhas ou vínculo de cidadão existente. Reset de cenários é exclusivo de admin e limitado ao cenário Rio; não apaga outras cidades ou seus anexos.

## Jornadas e verificação

Cidadão registra → gestão encaminha e responde → cidadão acompanha e avalia. Apoios e respostas de consulta são únicos por identidade. Decisões municipais exigem justificativa e histórico. Atualize/reabra telas para buscar mudanças; não há push.

`npm test`, `npx tsc --noEmit` e `npm run lint` verificam o cidadão. `npm test --prefix backend` inclui integração real quando DATABASE_URL aponta para banco exclusivo de teste; não use banco de apresentação em testes que restauram cenários. `npm test --prefix municipal` e `npm run build --prefix municipal` verificam o painel. `npm run openapi --prefix backend` gera o contrato. A coleção em `postman/` testa a API real sem publicar na nuvem.

Evidências e limitações: `plan/11-validacao-integrada.md` e `plan/13-validacao-municipal.md`. Skills oficiais Expo selecionadas, com licença e revisão fixada, estão em `.agents/skills`.

## Hospedagem e serviços

O deploy web para VPS inclui cidadão, gestão, API e HTTPS, usando `compose.production.yaml` e `.github/workflows/release.yml`. Consulte [deploy/README.md](deploy/README.md) para preparar DNS, ambiente, registry e SSH. A publicação automática depende de `VPS_DEPLOY_ENABLED=true`; o Compose local continua disponível para desenvolvimento.

A assistência usa Gemini no servidor quando configurado. Pode analisar uma foto autorizada para sugerir título e descrição; sem chave ou em falhas, mantém o preenchimento manual e não afirma ter analisado a imagem. Os arquivos de evidência são públicos por URL UUID opaca. Persistência requer volumes e backup. ViaCEP e IBGE podem ficar indisponíveis: a interface conserva o trabalho e permite tentar novamente, sem inventar um município.

## Demonstração e consolidação territorial
Home, Território e Resultados compartilham o bairro escolhido. Ocorrências e iniciativas participam da exploração; o mapa exige coordenadas explícitas, enquanto a lista inclui conteúdos de bairro ou município sem ponto. Indicadores separam abrangência municipal de bairros. Acompanhamentos de cidades anteriores possuem detalhe autorizado somente leitura.

Consulte [o roteiro reproduzível](plan/15-roteiro-demonstracao.md) e [a validação desta consolidação](plan/16-validacao-consolidacao.md).
