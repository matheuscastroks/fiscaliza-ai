# Validação da identidade e das fotografias

Entrega de 18/10/2026. Referências: três imagens fornecidas pelo usuário; contrato em `17-identidade-referencia.md`. A ampliação solicitada durante a execução inclui fotos enviadas em propostas e exemplos persistidos no banco.

## Resultado

- Instrument Sans local, paleta #212529 / #F5F6F7 / #FFFFFF, controles em cápsula, botões circulares e barra inferior opaca.
- Cards fotográficos e detalhes de ocorrências/propostas com imagem ao fundo e painel inferior acoplado. O painel expande por gesto ou botão; seções recolhem e a ação principal permanece no rodapé.
- Propostas aceitam até três fotos na interface, com preparação, remoção, rascunho e tentativa posterior. A API admite até cinco anexos próprios do município da sessão. Sair durante o upload impede publicar a proposta depois da desmontagem; preparação de foto bloqueia envio antecipado.
- Menu integrado sem pontos fictícios, selo de vínculo institucional ou atalhos para funções inexistentes. A barra deixa os formulários livres e tem largura limitada em desktop.
- Voltar usa histórico quando disponível; entradas diretas e recargas retornam ao Início, ao onboarding ou ao login conforme a sessão. A pilha tem as abas como entrada padrão.

## Verificações executadas

| Verificação | Evidência |
| --- | --- |
| Testes do app | 28 aprovados |
| API com PostgreSQL exclusivo | 24 aprovados, zero falhas ou skips |
| Postman CLI local | 30 requisições, 64 assertions, zero falhas |
| TypeScript e lint | Verificados; import sem uso do histórico corrigido |
| Painel municipal | Build Vite aprovado com fotos da proposta |
| Expo web / Android | 32 rotas web e bundle Hermes Android exportados |
| Detector visual | Executado uma vez nos alvos alterados: lista vazia |

Chrome headless, viewport cidadão 390×844 e desktop 1440×1000: fotos de exemplo carregadas da API/banco; expansão e recolhimento dos dois detalhes; foto enviada por seletor real, criada via multipart e preservada após reabrir a proposta; erro de acompanhamento visível junto ao rodapé; seções recolhíveis; menu; formulário sem barra sobreposta. Zero erros JavaScript na jornada concluída. O cartão cresceu de 339 para 510 px ao dobrar os textos, preservando título e ação.

Entrada direta em ocorrência, proposta e Resultados seguida de Voltar chegou ao Início sem o aviso de GO_BACK. Isso testa o navegador; não equivale a executar o gesto de retorno no Android.

## Banco local e fontes

Três fotografias CC0 foram pesquisadas, baixadas e versionadas. [Fontes, autores, licença e hashes](../backend/data/demo-media/README.md) acompanham os arquivos. São exemplos ilustrativos do cenário, identificados em Sobre; não são fotos dos endereços fictícios dos registros.

O seed foi executado sem reset em `fiscaliza_preview`. Havia oito registros antes e depois; hashes de todos os campos não relacionados à mídia permaneceram iguais. Fotos existentes do cidadão não são substituídas. A API reiniciada respondeu health e login com 200; os três JPEGs responderam 200 por `192.168.1.38:3001`, usado no celular. Não foi alterado o endereço local do Expo nem restaurado o cenário do usuário.

As capturas e scripts locais estão em `.validation/`, ignorado pelo Git. A primeira inspeção usou uma imagem interceptada somente no navegador; as capturas finais usam os arquivos realmente associados no banco. A regressão final seleciona a rota visível, pois o Expo mantém telas anteriores ocultas no DOM.

## Limites

Gestos, câmera/galeria nativa, fonte ampliada do sistema, leitor de tela e teclado em Android/iOS ainda exigem conferência em aparelho. A exportação Android não é APK nem teste nativo. Não houve push, deploy ou medição de desempenho. Arquivos da revisão de nome e outras alterações paralelas permanecem separados desta entrega.


## Refinamentos solicitados durante a validação

- Perfil reorganizado por identidade, município, participação e conta; galeria para foto local por conta e componente UserAvatar comum ao início/menu/perfil.
- Migração aditiva 0003_user_avatars.sql; retratos iniciais das três contas persistidos, sem sobrescrever fotos existentes. Os seis JPEGs são servidos localmente por allowlist. Créditos Pexels separados das fotos CC0 de ocorrências.
- Menu plano, rótulos curtos, sem “Meu perfil” redundante, caixas de ícones ou sombras decorativas.
- Acompanhar usa gap de 16. RecordCard sem margem própria e com gradiente de contraste contínuo.
- DetailSheet desenha a foto até o topo; retorno e painel expandido preservam os insets. Alteração visual de status bar é por foco da rota.
- Barra inferior com largura min(window - 64, 440), círculo estável de 52 e quatro abas verificadas no navegador.
- Território: filtros progressivos, modos Mapa/Lista distintos, seleção de marcador, recorte do mapa em contêiner com raio 28 e overflow hidden. Reset limpa busca, bairro, situação, tipo e área.

Verificação atualizada: API **25/25**, zero skips; Postman CLI **30 requisições e 66 assertions**, zero falhas; TypeScript, lint e exportações web/Android passaram. Retratos das três contas foram confirmados por login e GET 200 na rede Wi-Fi do celular. Houve diferença histórica de finais de linha em uma migração local; foi aplicada a migração aditiva usando cópias temporárias com o checksum histórico correspondente, sem alterar journal nem conteúdo SQL. A fonte de migração versionada foi preservada.

Validação visual dos refinamentos: foto escolhida pelo seletor persistiu após reload; as quatro abas mantiveram círculo 52 × 52 e a barra mediu 326 px no viewport 390 px; Acompanhar confirmou gap 16 px; busca sem resultado e limpeza dos filtros passaram; o gradiente foi confirmado no card renderizado; ocorrência e proposta apresentaram imagem com y=0 e expansão/recolhimento funcionando. Nenhum erro JavaScript. Os testes automatizados precisaram usar alt nas imagens do Expo Web e restringir seletores às telas visíveis mantidas pelo Router.
