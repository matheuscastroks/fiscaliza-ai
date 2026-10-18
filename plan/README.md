# Plano de evolução — Fiscaliza aí com Superpowers

## Como usar este planejamento

Revisão de 29/09/2026. Este é um roteiro de descoberta, especificação e entrega. Os documentos de fase não são planos de implementação prontos para execução: decisões de arquitetura e produto ainda precisam ser fechadas. Consulte o [brief consolidado](00-brief-e-decisoes.md) e o [catálogo de skills](07-skills-e-metodo.md).

O Superpowers organiza cada subsistema pelo ciclo: `brainstorming` → especificação escrita e revisada pelo usuário → `writing-plans` → escolha de execução → implementação → verificação. O pedido atual autoriza reescrever os documentos; não inicia desenvolvimento do produto.

Manter todos os artefatos em `plan`, conforme a preferência do usuário. As especificações futuras ficarão em `plan/specs/` e os planos executáveis em `plan/implementation/`, criados quando houver conteúdo aprovado para eles. Não criar documentos vazios para aparentar progresso.

Para cada plano executável, usar o cabeçalho de `writing-plans` com Goal, Architecture, Tech Stack, Spec, Global Constraints e Review Focus. Cada tarefa terá arquivos reais, interfaces consumidas/produzidas, passos verificáveis, testes com resultados esperados e checklist. Definir contratos locais para os mocks; sem backend.

## Propósito e limites

Projeto de TCC voltado a cidades inteligentes: permitir que cidadãos registrem problemas da via pública e que a gestão municipal organize, localize e acompanhe essas demandas. O benefício esperado é melhorar a informação disponível para decisões municipais; a efetividade desse benefício deverá ser avaliada, não presumida.

Diretrizes confirmadas: app Android/iOS do cidadão e painel web da prefeitura com dados mockados. Sem backend, banco remoto, autenticação ou gov.br reais. A entrega apresenta as jornadas, sem operação municipal real.

Este diretório contém planejamento, não autorização para implementar ou publicar o aplicativo. Todas as fases estão **planejadas, não iniciadas**; a leitura inicial do código é apenas evidência para orientar o diagnóstico.

## Sequência de trabalho

| Fase | Documento                                                     | Resultado e dependência                                                              |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 01   | [Diagnóstico e recorte do TCC](01-diagnostico-e-escopo.md)    | Base técnica verificada e pergunta de pesquisa delimitada                            |
| 02   | [Estratégia e experiência](02-estrategia-e-ux.md)             | Jornadas, requisitos e arquitetura da informação; depende de 01                      |
| 03   | [Mocks e disponibilização](03-infraestrutura-e-identidade.md) | Arquitetura e disponibilização definidas; depende de 01 e dos requisitos de 02       |
| 04   | [Protótipo e sistema visual](04-prototipo-e-ui.md)            | Fluxos testados e especificação visual; depende de 02, incorporando restrições de 03 |
| 05   | [Implementação incremental](05-implementacao.md)              | Jornadas interativas com mocks; depende de 03 e 04                                   |
| 06   | [Validação e entrega acadêmica](06-validacao-e-entrega.md)    | Evidências, demonstração reproduzível e limites documentados; depende de 05          |

Cada fase deve registrar entregáveis, evidências, decisões e pendências antes de avançar. Infraestrutura e wireframes podem ser estudados em paralelo depois de definido o escopo. Não atribuir datas antes de conhecer o prazo do TCC e a disponibilidade de trabalho.

## Acompanhamento

- [x] Registrar o propósito do TCC, plataformas e diretrizes de UX informados pelo usuário.
- [x] Inspecionar os arquivos principais para orientar o diagnóstico, sem validar a execução do app.
- [x] Reorganizar o roteiro com Superpowers e instalar as skills selecionadas.
- [x] Fechar o canal da equipe gestora: painel web separado do aplicativo do cidadão.
- [ ] Fechar as restrições acadêmicas, orçamento e contas disponíveis.
- [ ] Executar e documentar o diagnóstico da fase 01.
- [ ] Especificar e revisar o primeiro subsistema antes de gerar seu plano de implementação.

Uma fase só muda para concluída com evidência de seus critérios de saída. Distinguir sempre: proposto, aprovado, implementado e verificado. Ler código não equivale a testar; instalar uma skill não equivale a executar sua análise.

## Decisões pendentes

- Prazo, critérios acadêmicos, orientador e método de avaliação do TCC.
- Existência de município parceiro e acesso a cidadãos ou servidores para pesquisa.
- Stack e hospedagem do painel web da prefeitura, confirmado como interface separada do aplicativo Android/iOS do cidadão. Ver [opções de disponibilização](08-disponibilizacao.md).
- Orçamento, contas de serviços, dispositivos de teste e forma de distribuição da demonstração.
- Continuidade dos cenários entre interfaces, sem sincronização por backend.

Confirmado: demonstração mockada sem backend. Proposta: fixtures coerentes, persistência local independente e cenários selecionáveis para a apresentação. Validar o roteiro antes de implementar.
