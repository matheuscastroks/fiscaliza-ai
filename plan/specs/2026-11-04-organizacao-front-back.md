# Organização do repositório em front, back e shared

**Data:** 04/11/2026. **Estado:** estrutura implementada em 05/11/2026; validações e limites no [registro de evidências](../evidence/2026-11-04-migracao-front-back.md).

## Objetivo e escopo

Organizar o aplicativo em `front/`, renomear `backend/` para `back/` e manter `shared/` na raiz. O resultado deve preservar as jornadas, os contratos HTTP, as rotas do Expo Router, a identidade nativa, os dados persistidos e a operação local e em containers.

Esta especificação formaliza a proposta discutida na conversa, cuja execução foi autorizada depois da criação do plano. Durante a execução o usuário restringiu as validações ao aplicativo móvel e à API: não criar interface web nem executar exportações ou testes de navegador. Ajustar somente os caminhos da infraestrutura web preexistente; esses testes deixam de ser critérios de conclusão desta execução. As regras vigentes são [AGENTS.md](../../AGENTS.md), [PRODUCT.md](../../PRODUCT.md) e [DESIGN.md](../../DESIGN.md). Decisões históricas de execução exclusivamente mockada não se aplicam.

## Decisões

1. Manter instalações npm independentes. O lockfile atual da raiz passa a `front/package-lock.json`; o de `backend/` passa a `back/package-lock.json`, sem alteração de conteúdo nesta migração.
2. Manter um `package.json` privado na raiz, sem dependências e sem `workspaces`, apenas com comandos de instalação e encaminhamento. Não haverá `npm ci` próprio na raiz nem um terceiro lockfile necessário à instalação.
3. Preservar a organização interna do aplicativo. Não introduzir `src/`, novos aliases de domínio, outro gerenciador de pacotes ou ferramentas de monorepo.
4. Preservar o conteúdo de `shared/`, inclusive seu `package.json` com `type: module`. Não publicar um pacote nem mudar sua estratégia de compilação.
5. Manter `deploy/`, `docs/`, `plan/`, `postman/`, `.github/`, instruções dos agentes e arquivos Compose na raiz. Manter também README, PRODUCT, DESIGN, ANTI_SLOP, LEIA_PRIMEIRO e Caddyfile; atualizar referências operacionais quando necessário.
6. Executar duas mudanças de código sequenciais e verificáveis: API primeiro; aplicativo depois. Cada mudança inclui seus ajustes de infraestrutura e documentação, sem deixar commits intermediários com caminhos deliberadamente quebrados.

## Estrutura final

```text
/
├── front/
│   ├── app/                 # mesmas rotas do Expo Router
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── services/            # inclui o AGENTS.md já existente
│   ├── stores/
│   ├── theme/
│   ├── utils/
│   ├── tests/
│   ├── scripts/
│   ├── app.json
│   ├── app.config.js
│   ├── metro.config.js
│   ├── eslint.config.js
│   ├── tsconfig.json
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── back/                    # conteúdo rastreado do atual backend/
├── shared/                  # contratos e helpers atuais, sem mover
├── deploy/
├── docs/
├── plan/
├── postman/
├── .github/
├── package.json             # orquestração sem dependências
├── compose.yaml
└── compose.production.yaml
```

## Fronteiras e resolução

O cliente usa a API por HTTP e importa código comum de `shared/`. A API importa `shared/` diretamente. Não criar imports de código de `back/` no aplicativo ou de `front/` na API. O teste estrutural de remoção de participação pode continuar inspecionando ambos os projetos; isso não é dependência de execução do produto.

Em `front/tsconfig.json`, preservar `@/*` como `./*` e adicionar `@/shared/*` como `../shared/*`. Imports relativos existentes que saem do aplicativo precisam ganhar um nível. Imports relativos da API para `shared/` mantêm a profundidade, pois a pasta continua irmã de `shared/`.

O Metro deve observar explicitamente `../shared`, preservando `expo/metro-config`. Sem configuração de workspaces, não depender da detecção automática de monorepo. Os bloqueios devem usar a raiz real do repositório para `back/` e diretórios de ferramentas, sem bloquear `shared/` ou as dependências de `front/`. A documentação oficial explica o vínculo entre workspaces e a configuração automática: [Expo — monorepos](https://docs.expo.dev/guides/monorepos/). A implementação será conferida contra o SDK 57 instalado.

Na API, manter `rootDir: ".."`, `outDir: "dist"`, NodeNext e o conjunto atual de entradas. A saída executável passa de `backend/dist/backend/src/` para `back/dist/back/src/`; os módulos compartilhados compilados continuam em `back/dist/shared/`. Não ampliar indiscriminadamente as entradas do compilador para todos os helpers do cliente.

## Ambiente e persistência

O ambiente do Expo passa a `front/.env`, ignorado pelo Git. `.env.compose` permanece na raiz; a configuração de produção permanece no local atual usado por `deploy/deploy.sh`. Não copiar segredos do servidor para o frontend ou para imagens. O template público do app passa a `front/.env.example`.

`node_modules`, caches, dist e projetos nativos gerados não participam da movimentação de arquivos rastreados. Reinstalar com os lockfiles preservados. Regenerar projetos nativos no novo diretório somente após conferir eventuais ajustes locais. Arquivos locais de uploads e credenciais exigem inventário privado e preservação, sem entrar em commits ou evidências públicas.

Manter nomes de serviços, volumes, projeto Compose de produção, portas, URLs e caminhos persistentes em containers. O contexto dos Dockerfiles continua na raiz para incluir `shared/`. Não alterar SQL, checksums de migrações, dados, buckets ou chaves de cache e armazenamento do aplicativo.

## Critérios de aceitação

- Instalação a partir de uma cópia sem dependências antigas funciona com `npm ci --prefix front` e `npm ci --prefix back`.
- Lockfiles movidos têm os mesmos hashes da linha de base; versões, nomes dos pacotes e identificadores nativos permanecem iguais.
- Comandos existentes de start, Android, iOS, teste, lint e API continuam disponíveis pela raiz; configuração e exportação Expo são executadas dentro de `front/`.
- Testes, tipos, lint, exportação web, compilação da API e testes com PostgreSQL descartável passam sem novas falhas ou exclusões de testes para acomodar a mudança.
- Imagens de API e cidadão compilam; a API encontra migrações, dados e módulos comuns no container; a imagem web serve rotas e assets.
- Home, exploração em mapa/lista, detalhe, salvos e acesso a canais oficiais preservam o comportamento em web e em uma build Android de desenvolvimento. Testar Expo Go separadamente quando disponível, sem tratar seu resultado como evidência da build nativa.
- Não há dependência de arquivos gerados no diretório antigo nem referências operacionais ativas aos caminhos removidos.
- Evidências distinguem código, web, dispositivo/emulador e infraestrutura. Limitação de ambiente é registrada como não verificada, sem transformar a migração em validada integralmente.

## Fora do escopo

Workspaces, consolidação de lockfiles, upgrades de SDK ou bibliotecas, extração de novas abstrações, limpeza funcional de legado, mudanças de produto, alterações de banco, importação de fontes oficiais e publicação em produção. Reorganizar helpers exclusivamente visuais que hoje estão em `shared/` é uma decisão futura.

## Entrega e reversão

A execução recomendada é sequencial pelo mesmo implementador, porque Docker, testes e comandos dependem dos caminhos definidos na etapa anterior. O plano executável está em [migração front/back](../implementation/2026-11-04-migracao-front-back.md).

Reverter os commits da migração em ordem inversa restaura a organização de código. Dados não exigem reversão de esquema, pois esta entrega não cria migrações. Ambientes locais, uploads e projetos nativos precisam seguir o inventário da linha de base; a reversão de Git não restaura arquivos ignorados. Produção permanece fora desta execução.
