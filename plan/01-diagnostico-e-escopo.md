# 01 — Diagnóstico e recorte do TCC

**Estado:** planejada. **Processo:** descoberta orientada por `superpowers:brainstorming`; `systematic-debugging` somente diante de falha reproduzida.

## Checklist e evidência

- [ ] Ler `package.json`, lockfile, `app.json`, layouts, stores e serviços; registrar versões declaradas e responsabilidades.
- [ ] Conferir instruções locais e condições do ambiente antes de executar verificações. Não atualizar dependências durante o diagnóstico.
- [ ] Executar `npm ls --depth=0`, `npx tsc --noEmit`, `npm run lint` e `npx expo-doctor` quando as ferramentas estiverem disponíveis. Registrar comando, data, saída e código de retorno; ausência de ferramenta é impedimento, não falha do produto. Autorizar previamente instalação de ferramentas caso necessária.
- [ ] Observar as jornadas em Android/iOS disponíveis e registrar dispositivo, resultado e reprodução de falhas. Não substituir evidência nativa por teste web.
- [ ] Consolidar o diagnóstico em `plan/evidence/01-diagnostico.md` durante a execução da fase, sem segredos.
- [ ] Fechar D04–D06 do brief e ordenar os problemas por impacto no ciclo cidadão–gestor.

**Saída para a próxima fase:** backlog com evidência, restrições conhecidas e recorte acadêmico revisado. Problemas técnicos só serão corrigidos em tarefas posteriores com comportamento esperado e teste definidos.

## Objetivo

Separar o que existe no código, o que funciona e o que será necessário para demonstrar a contribuição do projeto.

## Evidências iniciais

- Aplicativo React Native/Expo, com Expo Router, TypeScript e Zustand.
- `package.json` declara Expo 57 e React Native 0.86.3; o README ainda descreve Expo 53. Essa divergência não comprova compatibilidade nem execução bem-sucedida.
- Autenticação, relatos e estatísticas utilizam `services/mockApi.ts`; o estado de autenticação é persistido em AsyncStorage.
- Há mapa, lista, registro, detalhes, perfil, histórico e gamificação. A existência de telas não comprova completude dos fluxos.
- O serviço de IA lê `EXPO_PUBLIC_GEMINI_API_KEY` no cliente. Planejar respostas simuladas, sem chamadas externas ou chaves na demonstração.
- Permissões de localização e fotos têm textos em inglês; o texto de fotos fala em compartilhar com amigos, divergindo do contexto municipal.

## Trabalho planejado

1. Inventariar rotas, estados, integrações, dependências, lockfile, configuração e documentação; identificar recursos simulados e reais.
2. Verificar compatibilidade com fontes oficiais, executar diagnóstico Expo, TypeScript, lint e testes de execução em Android/iOS quando houver ambiente disponível. Registrar impedimentos sem declarar aprovação.
3. Auditar os fluxos existentes, persistência, comportamento sem rede, permissões e acessibilidade; registrar problemas com passos de reprodução e impacto.
4. Definir problema de pesquisa, público, contribuição esperada e limites da demonstração com os requisitos da faculdade.
5. Classificar o backlog por impacto no ciclo de atendimento, dependências e esforço. Manter gamificação e IA como recursos secundários até justificar sua contribuição.

## Entregáveis e conclusão

Inventário técnico, matriz de funcionalidades reais/simuladas, diagnóstico reproduzível, recorte acadêmico e backlog priorizado. Concluir quando o fluxo mínimo e os riscos bloqueantes estiverem documentados, com decisões pendentes atribuídas à fase responsável.

A API mockada existente é adequada ao escopo confirmado: avaliar sua reutilização, sem substituí-la por backend.
