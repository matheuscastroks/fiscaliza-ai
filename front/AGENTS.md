# Aplicativo Expo

As regras gerais de `../AGENTS.md` também se aplicam a este diretório. O produto é descrito em `../PRODUCT.md`; o sistema visual fica em `DESIGN.md`, acompanhado por `.impeccable/design.json`. Use o PRODUCT da raiz como fonte canônica, sem criar uma cópia local.

## Skills e contexto

As skills específicas do aplicativo ficam em `.agents/skills/`. Para tarefas Expo/EAS, leia primeiro `.agents/skills/expo-overview/SKILL.md` e siga o encaminhamento pertinente. Os arquivos de origem e licença acompanham as skills; preserve seu conteúdo ao reorganizar o projeto.

Ao executar ferramentas de design do frontend, use este diretório como projeto e consulte também `../PRODUCT.md`. O backend e os contratos compartilhados continuam sujeitos às instruções gerais da raiz.

## Comandos locais

Execute `npm start`, `npm test`, `npm run typecheck` e `npm run lint` dentro de `front/`. Na raiz do repositório, os scripts de mesmo nome encaminham para os pacotes apropriados. Instale módulos Expo com `npx expo install` neste diretório e preserve o lockfile.

Metadados de `.agents/` e `.impeccable/` devem permanecer fora do bundle, das entradas TypeScript da aplicação e das imagens Docker.
