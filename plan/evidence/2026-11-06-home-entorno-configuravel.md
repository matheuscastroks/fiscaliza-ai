# Execução — Home e entorno configurável

Plano: ../implementation/2026-11-06-home-entorno-configuravel.md

## Registro

- Implementação autorizada em 06/11/2026.
- Checkout contém alterações anteriores em muitos arquivos. Preservar; não criar commits que as incluam.
- Branch de implementação: feat/home-entorno.
- Execução direta; revisão independente ao final conforme executing-plans.
- Interfaces: API radial → transporte → adaptador → Home/Território; resolução → captura/editor; store → seletor/editor.
- Decisão: manter a cópia atual para preservar arquivos ainda não commitados necessários ao plano.

## Código e decisões de execução

- API: parâmetros centerLatitude/centerLongitude/radiusMeters, validação estrita, polígono municipal e condição circular em SQL antes de total, ordenação e cursor. Contratos de leitura existentes permanecem compatíveis.
- Resolução pública de ponto: `/api/territory/resolve`, com bairro único publicado ou null quando ausente/ambíguo. Malha municipal ausente retorna 503. A lista de leituras públicas do middleware inclui essa rota.
- App: lugares por usuário/município em AsyncStorage; seleção discriminada de município, bairro, raio e localização aguardando captura. Endereço textual não é geocodificado. Coordenadas de localização atual não são persistidas.
- Home: até cinco chamados recentes, filtros compartilhados, distância aproximada e acesso ao mapa/lista antes dos resultados. Salvos continuam independentes do entorno.
- Território: raio e área visível são modos alternativos; entrada explícita da Home encerra overrides anteriores e ativa 1746. Horário e precisão da posição ficam visíveis também no mapa.
- Revisão independente de código apontou seis problemas importantes. Foram corrigidos sobrescrita da posição por gravação pendente, preferência antiga atravessando contas, restauração da localização atual, bbox antiga prevalecendo sobre Home, camada 1746 desativada na entrada e falta de precisão no Território. Testes adicionais cobrem raio/gravação/captura concorrentes e resposta tardia do editor.
- Decisão: corrigir o gate legado que exigia login para consulta e lugares, seguindo PRODUCT.md e o plano aprovado. Perfil e rotas privadas continuam protegidos; nenhuma mutação da API foi aberta. Teste de navegação passou de RED para GREEN.
- Decisão: usar os controles compartilhados existentes e o mapa Mapbox instalado, preservando tema/identidade. Seletores compactos têm alvo mínimo de 48 e o raio não pode ser limpo para zero.
- Decisão: não criar commits nem misturar alterações anteriores do checkout; a entrega permanece na branch de implementação. Não houve push ou publicação.
- A tentativa de validar web encontrou suporte web ausente. Nenhuma dependência web foi instalada; a validação de uso foi redirecionada para o aparelho a pedido do usuário.

## Evidência automatizada

- API: `npm test --prefix back`, com DATABASE_URL apontando exclusivamente para `fiscaliza_entorno_test`: 44 testes passaram, nenhum ignorado. Migrações aplicadas somente nesse banco isolado.
- API, complemento: seis testes de raio/resolução passaram usando o mesmo banco de teste, incluindo 503 por malha ausente e chamado de bairro vizinho dentro do raio. Logs em `/tmp/entorno-api-focused.log`.
- App: `npm test --prefix front`: 16 arquivos de testes TS e 74 casos CJS passaram, sem testes ignorados. Logs em `/tmp/entorno-front-tests-final.log`.
- Regressões observadas em RED e corrigidas: captura sobrescrita por escrita anterior; modo atual perdido após reinício; escopo de bairro cruzando contas; raio confirmado divergindo da posição mais recente; editor travado após invalidar uma resolução; consulta pública bloqueada pelo middleware; navegação pública bloqueada pelo gate legado.
- Tipos de front/back verificados com TypeScript instalado em ambos os projetos; execução nativa Windows concluiu com código zero (`/tmp/entorno-types-windows-final.log`).
- Configuração Expo e geração OpenAPI passaram. Nenhum diretório Android/iOS foi gerado ou commitado.
- `npm run lint --prefix front` passou, sem erros ou avisos (`/tmp/entorno-lint-final.log`). Verificação adicional dos módulos de lugares/estado é registrada em `/tmp/entorno-features-lint-final.log`.

## Evidência Android

Dispositivo conectado por USB/ADB, modelo 2511FPC34G; pacote de desenvolvimento `com.anonymous.fiscalizaai`. Não é evidência de Expo Go, iOS ou web.

- Home renderizada, editor de lugares aberto e mapa nativo exibido.
- Formulário vazio apresenta a validação de nome; não confirma salvamento sem ponto válido.
- Falha no endpoint preservou nome/coordenadas digitados. O teste foi retomado contra a API local, sem alterar o serviço publicado.
- Lugar temporário “Teste entorno” foi salvo com um ponto público no Centro, selecionado na Home e alterado de 1 km para 5 km. Os resultados e distâncias mudaram com o raio.
- O lugar temporário foi excluído pelo fluxo com confirmação; a lista voltou ao estado vazio. A configuração de manter a tela ligada durante o teste foi restaurada ao valor original 0.
- O bairro selecionado antes do teste, Santa Cruz, foi reaplicado pelo seletor de Preferências e confirmado na Home. Selecionar um lugar pela tela de Preferências leva à Home; voltar de um link público sem histórico também retorna à descoberta, sem exigir login.
- Home → mapa → lista → Home foi verificado no aparelho com 5 km preservados. Depois de encerrar e reabrir o processo do app, o lugar temporário e o raio de 5 km foram restaurados. Árvores de controles e capturas separadas comprovam esses estados.
- Permissão já estava concedida no aparelho. Recusa e timeout são cobertos pelos testes de captura; não houve revogação de permissões do usuário para simular o diálogo.
- Capturas de teste e árvores de controles ficam em `/tmp/entorno-native-*`, sem incorporar dados pessoais ou capturas de outros aplicativos ao repositório.
- Houve reconexão USB, perda de adb reverse e indisponibilidade do Metro original. Esses problemas de conexão foram tratados separadamente dos resultados dos testes do produto.
- O retorno ao aparelho após a interrupção encontrou a tela em repouso; foi reativada para concluir os testes. O Metro Windows precisou escutar em LAN/IPv4 para atender ao adb reverse. A URL foi configurada apenas no processo de desenvolvimento; `front/.env` e a configuração genérica de `http.ts` foram restauradas.

## Medição SQL

EXPLAIN ANALYZE, somente leitura, em 27.811 registros locais, com centro público e uma amostra por raio. SELECT com LIMIT 50: 500 m = 6,352 ms; 1 km = 4,857 ms; 2 km = 28,529 ms; 5 km = 1,976 ms. Essa consulta isolada não inclui ordenação/COUNT de toda a rota e não mede desempenho do app, FPS, latência de rede ou tempo de abertura. Não foi criado índice sem evidência adicional de necessidade. Dados completos em `/tmp/entorno-sql-metrics.json`.

## Limites e disponibilização

Busca automática de endereços, sincronização de lugares, segundo plano, geofencing e ordenação por distância continuam fora do escopo. O ambiente publicado ainda precisa receber a API alterada para atender ao raio e à resolução de ponto; não houve deploy nesta tarefa. A API local de validação não executou migrações no banco usado pelo app.

Prévia nativa mantida em desenvolvimento: Metro Windows na porta 8084, encaminhado pelo ADB da porta 8081 do aparelho; API local na porta 3002. A configuração foi aplicada apenas ao processo de desenvolvimento. As variáveis persistentes do projeto e o transporte HTTP genérico permanecem como antes.
