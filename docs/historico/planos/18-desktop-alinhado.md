# Desktop alinhado ao aplicativo móvel

Validação local em 19/10/2026. Escopo: aplicativo cidadão Expo web e painel municipal React/Vite.

## Implementação

- Navegação lateral cidadã a partir de 1100 px; barra inferior e menu móvel abaixo disso. Árvore de rotas preservada no redimensionamento.
- Conteúdo até 1200 px, carrosséis com cards até 360 px e formulários até 760 px.
- Painel com as paletas compartilhadas de theme/colors.ts, Instrument Sans local e licença redistribuída, campos e ações em cápsula, miniaturas, capa fotográfica e comentários com avatar.
- Aparência do painel: Sistema/Claro/Escuro, persistência no navegador e acompanhamento do sistema.
- Docker do painel inclui o arquivo compartilhado de cores.

## Verificações executadas

- npm test: 36 testes aprovados.
- npm test --prefix municipal: seis testes aprovados.
- npx tsc --noEmit: aprovado.
- npx eslint . --no-cache: zero erros, cinco avisos preexistentes em stores/problemsStore.ts e stores/statsStore.ts.
- npm run build --prefix municipal e exportação Expo web: aprovados.
- Chrome com contas locais e dados persistidos, janelas de 1440x1000 e 390x844: navegação cidadã, carrossel, aparência, preservação de rascunho ao redimensionar, retorno às abas móveis; painel com fila, detalhe fotografado, propostas, consultas, ações, território e persistência do tema. Sem erros de página ou transbordamento horizontal nos cenários testados.
- Avatar do cabeçalho desktop abre o perfil; no móvel permanece o acesso ao menu.

Capturas e scripts de conferência local ficam em .validation/desktop-*, ignorados pelo Git. A evidência é web; não comprova execução nativa ou publicação em VPS. Build Docker não foi executado nesta etapa.
