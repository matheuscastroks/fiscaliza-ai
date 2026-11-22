# 02 — Estratégia, requisitos e experiência

**Estado:** planejada. **Entrada:** diagnóstico e contexto acadêmico. **Skills:** `superpowers:brainstorming`; entrevista `grill-me` opcional quando solicitada.

## Checklist e artefatos

- [x] Resolver D03: prefeitura em painel web separado; cidadão em aplicativo Android/iOS.
- [ ] Detalhar as tarefas de gestão para navegador e as jornadas móveis do cidadão.
- [ ] Registrar necessidades, hipóteses e evidências em `plan/evidence/02-pesquisa-ux.md` ao realizar a pesquisa.
- [ ] Descrever tarefas, informação necessária, resultado percebido e recuperação de falhas para cada perfil.
- [ ] Definir critérios de aceitação observáveis para cada jornada antes da composição visual.
- [ ] Elaborar `plan/specs/experiencia-design.md` com navegação, estados, conteúdo, visibilidade e requisitos de acessibilidade.
- [ ] Revisar contradições, pressupostos e limites; submeter a especificação à revisão do usuário antes de detalhar implementação.

**Saída:** jornadas e arquitetura da informação revisadas. Sem pesquisa externa, identificar a avaliação como baseada em hipóteses ou inspeção, sem fabricar validação com cidadãos.

## Objetivo

Definir por que cada fluxo existe e como atende cidadãos e servidores municipais antes de desenhar sua aparência.

## Pesquisa e requisitos

- Investigar como cidadãos relatam problemas hoje e como a equipe municipal recebe, classifica e acompanha demandas. Usar entrevistas e observação quando houver acesso; identificar hipóteses quando não houver pesquisa de campo.
- Considerar familiaridade digital, acessibilidade, conectividade e uso em via pública. Não apresentar personas hipotéticas como resultados de pesquisa.
- Relacionar cada requisito a uma necessidade, comportamento esperado e critério de aceitação.

## Jornadas propostas para validação

**Cidadão:** identificar-se → consultar ocorrências próximas → registrar categoria, descrição, localização e foto quando necessária → revisar → enviar → receber confirmação e identificador → acompanhar o histórico.

**Gestor:** acessar o município autorizado → consultar fila e mapa → filtrar demandas → verificar relato → classificar e encaminhar → atualizar andamento com justificativa → registrar conclusão.

Definir na especificação funcional os estados e transições do atendimento, responsáveis, visibilidade dos dados e tratamento de relatos duplicados, inadequados ou fora da área atendida. Os estados atuais são `pending`, `in_progress` e `resolved`; alterações exigirão mapeamento explícito.

## Arquitetura e comportamento

- Criar mapa de navegação por perfil, vocabulário consistente e hierarquia centrada nas tarefas principais.
- Usar controles familiares, rótulos explícitos, retorno visível e comportamento consistente entre telas.
- Permitir revisar e corrigir antes de enviar, preservar o preenchimento após falhas e oferecer reversão quando aplicável. Mudanças administrativas precisam preservar histórico.
- Explicar permissões no contexto e prever alternativa de localização manual quando a permissão for negada.
- Planejar carregamento, ausência de resultados, erro, acesso negado, sessão expirada e envio incerto. Simular esses estados de forma determinística, sem sugerir recebimento por uma prefeitura real.
- Definir conteúdo público e privado antes de expor mapa, fotos ou identidade de cidadãos.

## Entregáveis e conclusão

Jornadas, requisitos priorizados, mapa de navegação, matriz de estados/permissões e roteiro de avaliação. Concluir com o ciclo mínimo cidadão–gestor definido e os cenários de falha contemplados. Métricas propostas: conclusão das tarefas, erros, necessidade de ajuda e compreensão dos status; metas serão fixadas antes dos testes, após a avaliação inicial.
