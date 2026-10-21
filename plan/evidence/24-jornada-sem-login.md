# Jornada cidadã sem login — validação local

Data: 20/10/2026. Alterações locais, sem commit ou push, conforme instrução do usuário.

## Entrega

- Início prioriza exploração, salvos, demandas recentes e atendimento; gráficos ficam no aprofundamento.
- Navegação móvel e desktop: Início, Explorar, Acompanhar e Agir. Menu e preferências independem de conta. Módulos legados de escrita e perfil usam proteção de navegação; nenhuma autorização do backend foi removida.
- Salvos e bairro preferido persistem via AsyncStorage existente. Gravações são serializadas; falhas preservam o estado anterior e aparecem na interface. Filtros temporários não substituem a região preferida.
- Acompanhar consulta somente os IDs salvos, com até três leituras concorrentes, cancelamento e preservação de resumos em falhas. Atualização não ressuscita itens removidos.
- Agir oferece o portal e páginas oficiais de iluminação, pavimentação e resíduos, verificadas em 20/10 no domínio `www.1746.rio`. Não existe envio de solicitação pelo app.
- Onboarding reutiliza os SVGs locais e explica descoberta, acompanhamento e atendimento. Preferências oferecem exclusão dos salvos em bottom sheet, preservando região e aparência.

## Evidências automatizadas

`npm test`: 73 testes aprovados (38 testes puros e 35 verificações Node), zero falhas. Inclui novos casos para reinício, hidratação tardia, gravação recusada, alternâncias rápidas, deduplicação, isolamento municipal, atualização após remoção, preferência independente do filtro e proteção de rotas. Os primeiros quatro testes de persistência falharam antes da implementação e passaram depois.

`npx tsc --noEmit`, `npm run lint` e exportação Expo web concluíram sem erros; lint sem avisos. Logs em `.validation/filter-performance/citizen-*-final.log`. Nenhuma dependência foi instalada e os ambientes/lockfiles foram preservados.

## Navegador

Chrome em 390 × 844 e 1440 × 1000: salvar um chamado real, recarregar, reencontrar em Acompanhar, persistir bairro, abrir preferências sem sessão, cancelar/confirmar exclusão e preservar resumo com API indisponível. Rotas públicas fizeram zero requisições a `/auth/me`; sem erros de página. A rota legada de proposta não permaneceu acessível anonimamente.

O navegador de validação bloqueou conexões diretas à API. O preview foi exportado com endpoint loopback e usou encaminhamento de leitura para a mesma API na porta 3001. Somente armazenamento do contexto de teste foi alterado; o banco não recebeu mutações. Isso valida a interface e os contratos consumidos, não conectividade direta de um celular.

O teste adicional Explorar/lista → detalhe → voltar identificou retorno ao topo (700 → 0). Após correção, o mesmo registro permaneceu inteiramente visível (700 → 674, variação de 26 pixels na recomposição). A verificação usa identidade e visibilidade do registro, sem exigir igualdade de pixels. Log: `.validation/filter-performance/citizen-list-return-fixed.log`.

Capturas locais: `citizen-home390.png`, `citizen-home1440.png`, `citizen-saved390.png`, `citizen-settings390.png` e `citizen-act390.png`, em `.validation/filter-performance/`.

## Limites

Não houve inspeção nativa neste ciclo. Gestos, bottom sheet, armazenamento e retorno ao app externo ainda precisam de inspeção no Expo Go. Sem medição de FPS ou alegação de ganho de fluidez. Não houve deploy, mudança de configuração do Expo Go, sincronização entre dispositivos ou recuperação de salvos perdidos antes da persistência.
