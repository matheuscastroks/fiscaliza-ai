# Inteligência territorial — validação da entrega

Data: 20/10/2026. Base: 4f150da. Execução inline, tarefa por tarefa, na main; commits por responsabilidade. AGENTS.md preservado.

## Entregue

Seed preserva contas e registros existentes. Sincronização 1746 compartilha orçamento por execução, trava por fonte e journal com cobertura real. SIURB tem catálogo fixo, leitura delimitada, mapeamento conservador e publicação recuperável por camada. API pública inclui equipamentos paginados, limites de bairro e panorama com datas explícitas. Mapa/lista combinam camadas; ficha cadastral e página do bairro mantêm origem, ausências e cobertura. Onboarding, Ajuda e Sobre refletem a independência do produto.

## Dados oficiais, sem modificar o banco do aplicativo

Importação integral realizada em banco PostgreSQL UTF-8 isolado: 167 bairros, 1.540 escolas, 344 unidades de saúde e 2.387 espaços públicos. Preservados 226 espaços sem nome oficial e 177 equipamentos sem bairro confirmado (80 escolas, 49 saúde, 48 espaços). Nenhuma data de referência foi inventada. Evidência de uso, licença e extração em [20-siurb-fontes.md](20-siurb-fontes.md).

O banco de apresentação isolado contém os cadastros reais, mas não recebeu chamados 1746 fictícios. Por isso seu panorama mostra a fonte 1746 indisponível, sem produzir indicadores inventados. Nenhuma consulta BigQuery faturada, seed, limpeza ou sincronização no banco do usuário foi executada.

## Código e contratos

- App: npm test, 56 testes aprovados (38 puros e 18 de compatibilidade), sem skips. npx tsc --noEmit e npm run lint aprovados.
- Backend: 59 testes aprovados, sem skips, com PostgreSQL dedicado; build e npm run typecheck --prefix backend aprovados. Incluem seed, autorização, limite financeiro, concorrência, timeout, erro ArcGIS HTTP200, lote perdido, retirada de cadastro, vínculo ambíguo, migrações idempotentes, filtros e datas.
- Migrações 0007–0011 aplicadas somente em bancos isolados. Testes de escrita não usam o banco do app.
- npm run openapi --prefix backend gerou as seis rotas territoriais e schemas. O artefato permanece ignorado no Git, como no pipeline existente.
- Expo web exportado com sucesso. docker compose -f compose.production.yaml config --quiet e bash -n deploy/deploy.sh aprovados com configuração descartável. Nenhuma publicação de dados decorre do build.

## Navegador

Chrome com dados reais isolados, 390×844, 320×844 e 1440×1000: Home, seleção de bairro, camadas, clusters, mapa/lista, ficha e navegação bairro → mapa. Centro: 11 escolas, 7 unidades de saúde, 61 espaços vinculados. Sem erros de execução de página ou overflow horizontal nos tamanhos conferidos; modo escuro verificado no desktop.

Respostas controladas somente no navegador verificaram paginação 100→200, falha em saúde preservando escolas, resposta atrasada do Centro sem substituir Santa Cruz, recuperação de bairro inválido, fonte válida vazia distinta de duas fontes indisponíveis e datas inválidas preservando o conteúdo. São evidências de comportamento da UI, não dados oficiais adicionais.

Capturas e logs locais estão em .validation/territorial-execution; não são entradas de build nem artefatos versionados. Os controles expõem papéis e rótulos acessíveis; isso não equivale a auditoria completa com leitor de tela. Foco/rolagem web conferidos; teclado virtual, pull-to-refresh, WebView e gestos nativos continuam dependentes de aparelho.

## Revisão final e decisões

Uma revisão independente identificou três pontos importantes, corrigidos em 87df2a1: datas do panorama omitidas na consulta de chamados, cache municipal consumido sob bairro não confirmado e nomes informados pela fonte apresentados como vínculo confirmado. Testes observaram a falha antes da correção; regressões puras e no navegador passaram depois. A suíte do app foi repetida integralmente.

Rulings: listas retornam resumos sem polígonos e detalhes carregam geometria; publicação cadastral tem identificador para evitar paginação entre versões; campos e datas ausentes permanecem nulos; PostgreSQL UTF-8 é requisito, sem remover caracteres oficiais. Se essas escolhas mudarem, consumidores e importação precisam ser revistos.

Melhoria menor adiada: proveniência compacta por camada no próprio seletor do mapa. Fonte e datas estão disponíveis nas fichas e no panorama; o seletor já distingue contagens e publicação anterior. Não impede a exploração, mas exige abrir o detalhe para consultar toda a proveniência.

## Limites de validação e publicação

ADB foi executado e não encontrou dispositivo conectado. Android/Expo Go e auditoria completa com TalkBack/VoiceOver permanecem pendentes; exportação web não os substitui. Não houve implantação VPS. CI remoto será conferido após o envio dos commits; resultados locais acima não representam aprovação remota.

Para disponibilizar essas camadas no banco operacional, ainda é necessário aplicar migrações e executar a importação administrativa após conferir conexão e codificação, conforme README.md. Essa promoção foi separada da validação para preservar os dados do usuário.
