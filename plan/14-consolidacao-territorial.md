# Consolidação da experiência cívica

## Objetivo aprovado

Concluir as jornadas Android, tornar o recorte territorial comum à Home, mapa, listas e indicadores e distinguir visualmente os acontecimentos da cidade. Preservar API/PostgreSQL, município da sessão, participação persistente e resposta institucional. A aprovação do usuário em 17/10/2026 autoriza executar os três ciclos apresentados na revisão.

## Decisões

- Trabalho no checkout atual da main, conforme preferência anterior; sem push/deploy. Agentes possuem arquivos exclusivos e revisão final independente.
- Abrangência cívica explícita: município, bairro ou ponto localizado. Bairro por texto é um recorte editorial normalizado, não um polígono oficial. Não inferir coordenadas nem centrar iniciativas sem localização no mapa.
- Conteúdos municipais continuam acessíveis ao escolher um bairro, identificados por abrangência municipal. Indicadores distinguem contexto local e abrangência municipal.
- Seleção de bairro compartilhada entre Home e Território, isolada por usuário e município; padrão do bairro do perfil. Busca, estados vazios e alternativa em lista permanecem.
- Histórico anterior abre detalhe somente leitura em rota específica, restrita a autoria ou participação persistida. As rotas normais e todas as mutações conservam a autorização municipal.
- Identidade atual: base mineral, azul utilitário, tipografia nativa; novos destaques usam prazos, respostas e resultados reais. Sem slogans, pontos competitivos, animação de marcador ou coordenadas fictícias.
- Anexos conservam o contrato atual durante esta consolidação. Sua exposição pública é limite documentado para uso com fotografias reais; não apresentar UUID como autorização.

## Execução

1. API: contrato aditivo de abrangência, validação geográfica, detalhes históricos autorizados e testes de regressão. Responsável: territorial_api.
2. Território: filtros e resumo comuns, mapa misto apenas com pontos válidos, listas dos conteúdos sem localização, criação de proposta e testes puros. Responsável: territorial_mobile.
3. Gestão: edição/publicação da abrangência e validação de campos. Responsável: territorial_panel.
4. App: safe areas, Home orientada a acontecimentos, histórico navegável somente leitura, roteiro de demonstração. Responsável: agente principal.
5. Revisão: autorização, estados de interface, datas/abrangência, tipos, lint, suites, builds e inspeção possível de web/Android. Registrar separadamente o que foi executado e o que permaneceu sem validação em aparelho físico.

## Critérios de aceite

- Home não promete bairro ao apresentar apenas dados municipais.
- Trocar bairro afeta os quatro tipos de conteúdo sem cruzar usuários/municípios.
- Ponto sem coordenadas nunca ganha marcador; conteúdo municipal tem rótulo distinto.
- Histórico próprio anterior é legível, sem liberar escrita nem detalhes de terceiros.
- Perfil, Município e Resultados possuem um único responsável pela safe area.
- Demonstração reproduzível com contas e CEP conhecidos, sem reset destrutivo automático.
- Testes existentes e novos passam; documentação distingue evidência de código, emulador, navegador e celular físico.

## Registro

- Diagnóstico: revisão confirmou Home municipal com texto de bairro, safe areas aninhadas, mapa só de ocorrências e histórico sem detalhe. Backend com 1.263 linhas e anexos por URL pública.
- Implementação em andamento; resultados e decisões posteriores serão registrados neste arquivo e no roteiro de validação.

## Encerramento da implementação

Contrato territorial, indicadores, Home, filtros compartilhados, histórico autorizado e formulários de abrangência implementados. API: 22 testes; app: 28; painel: 6; Postman: 26 requisições e 53 assertions, sem falhas. Builds web, Android e painel aprovados. Ciclo gestão–cidadão e onboarding conferidos em navegador; validação nativa permanece pendente. Consulte `15-roteiro-demonstracao.md` e `16-validacao-consolidacao.md` para evidências e limites. Alterações concorrentes de navegação/identidade do usuário foram preservadas fora destes commits.
