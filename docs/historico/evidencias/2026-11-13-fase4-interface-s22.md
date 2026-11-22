# Fase 4 — interface no aparelho e acessibilidade (13/11/2026)

Branch `fix/app-fase-4-interface`. Escopo: só `front/` (telas, componentes, theme). Ficaram de fora `_layout.tsx`, `services/http.ts`, `stores/*`, `back/`, `shared/` e `deploy/`.

## Evidência de código

Em `front/`:

- `npm test`: 30 + 170 testes Node e 5 Jest passando. Numa rodada com o Gradle compilando ao lado, 2 testes Jest estouraram o tempo e passaram ao repetir.
- `npm run typecheck`: sem erros.
- `npm run lint`: sem avisos.

Testes novos ou alterados:

- `tests/fase4-interface.test.cjs`:
  - fase do 1746 em texto simples;
  - `formatCallDateTime`;
  - caixa de enquadramento de `computeOverviewRegion`;
  - contraste AA do `subtle` nos dois temas;
  - "Buscar nesta área" só com gesto;
  - copiar protocolo pela área de transferência;
  - recuo único da tab bar;
  - hook único de reduzir movimento.
- `tests/map-camera.test.cjs`:
  - caixa nova enquadra com o recuo da tela;
  - a mesma caixa não reenquadra;
  - recentralizar continua funcionando.
- `tests/map-updates.test.cjs`: estilo escuro `dark-v11` no modo escuro.
- Testes que liam o código-fonte passaram a esperar o comportamento novo: número do WhatsApp em constante, posição medida da pílula, `GovBrButton` removido.

## Evidência no aparelho (Galaxy S22, USB)

Ambiente:

- Build de desenvolvimento novo, gerado com `npx expo run:android --no-bundler` porque o `expo-clipboard` é módulo nativo.
- Metro deste worktree via `adb reverse tcp:8081`, contra a API de produção.
- Capturas feitas com `adb exec-out screencap`. Ficaram fora do repositório.

| Item | Escuro | Claro | Observação |
| --- | --- | --- | --- |
| 1. Barra de busca | ok | ok | "Santa Cruz" aparece inteiro e a busca virou ícone. Ao tocar, o campo ocupa o lugar do bairro, com voltar. O placeholder virou "Assunto ou protocolo", porque "Buscar chamado ou serviço" ainda cortava. |
| 2. Linha de filtros | ok | ok | A faixa rola até a borda da tela e termina com recuo. Chips com 36 pt e folga de toque até 48. |
| 3. "Buscar nesta área" | ok | — | Não aparece ao abrir nem depois de enquadrar ou localizar. Aparece depois de arrastar o mapa (`isGestureActive`). |
| 4. Câmera inicial | ok | ok | `fitBounds` nos pontos, com o recuo da barra de busca, do resumo e da tab bar. Os grupos "4" e "23" ficam dentro da área livre. "Ver a cidade toda" reenquadra. |
| 5. Barra de status | ok | ok | Faixa `statusScrim` sob a barra de status. Os ícones ficam legíveis nos dois temas. |
| 6. Mapa no escuro | ok | ok | `dark-v11` no escuro e `streets-v12` no claro. Contorno, grupos e pontos usam `theme/map.ts`. Rótulos do mapa em português (`localizeLabels`). |
| 7. Tab bar | ok | ok | Agir e Perfil terminam acima da barra. Salvos, Agir, Perfil e a lista em tela cheia usam `useTabBarInset`. |
| 8. Detalhe | ok | — | Voltar, compartilhar e salvar ficam numa linha, e o título ocupa a largura toda. "Tipo: Andamento" virou "Fase no 1746: em andamento". Copiar protocolo mostra "Protocolo copiado", e o Android confirma "Copiado para a área de transferência". |
| 9. Lista | ok | — | Começa em "50 de 356 nesta área". Só rolando, chega a "150 de 356" (`onEndReached`). O botão "Carregar mais" continua como alternativa. |

Problemas achados no aparelho e corrigidos:

- O título "Chamado 1746" cortava; virou "Chamado".
- O texto `selectable` do protocolo engolia o toque.
- O toast ficava atrás do ScrollView.
- O `import()` dinâmico do clipboard gerava um bundle assíncrono que levava 141 s no Metro; virou import estático.

## Não verificado nesta sessão

- Fonte 1,5× e TalkBack no aparelho. Mudar ajustes do sistema do aparelho ficou com o usuário. O código ganhou:
  - `accessibilityRole="header"` em `AppHeader`, `SectionHeader` e no título do detalhe;
  - rótulo e dica no mapa;
  - `accessibilityLiveRegion` no resumo.
- `maxFontSizeMultiplier` (1,1–1,3) não foi revisto.
- Detalhe offline (`NetworkError`) contra 404: diferenciado no código, não forçado no aparelho.
- FlashList v2: avaliada e não adotada. A paginação com FlatList funcionou, e não há medição que justifique a troca.
- O loop de avisos do Reanimated ("Dependencies should only be used on the web") continua. É da Fase 3 e deixa o fast refresh lento no aparelho.
