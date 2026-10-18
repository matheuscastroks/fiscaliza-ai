# Validação da participação integrada

Verificação local em 17/10/2026, branch `feat/participacao-urbana`, base `dd34ebf`. Implementação concluída; os limites de execução abaixo fazem parte da entrega.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm test` | 14 testes passaram: repositório legado, heurística e geografia compartilhada |
| `npx tsc --noEmit` e `npm run lint` | Passaram |
| `npm test --prefix backend` com `DATABASE_URL` | 11 testes passaram, zero falhas e zero pulados |
| `npm run openapi --prefix backend` | Especificação gerada dos schemas Fastify |
| `npm test --prefix municipal` | 2 testes passaram |
| `npm run build --prefix municipal` | TypeScript e Vite passaram |
| `npx expo export --platform web --output-dir .validation/web-export --max-workers 2` | Bundle e 30 rotas estáticas gerados |
| `npx expo export --platform android --output-dir .validation/android-export --max-workers 2` | Bundle Hermes gerado |
| Postman CLI, coleção local | 21 requisições e 48 assertions, zero falhas; sem publicação na nuvem |
| Compose e workflow CI | YAML parseado; workflow criado, ainda sem execução no GitHub |
| `git diff --check` | Sem erros |

Os testes PostgreSQL usaram um servidor real temporário PostgreSQL 18, na porta 55432 e banco exclusivo. Cobriram autoria, permissões, apoios idempotentes, comentários concorrentes, consultas, encerramento, avaliação, sessões, anexos válidos/corrompidos, releitura em nova instância e restauração de cenários. O Compose aponta para PostgreSQL 17; sua execução não foi comprovada nesta máquina.

## Inspeção no navegador

Chrome conectado: login municipal, fila, filtros, detalhes/histórico e propostas; cidadão com login, início, quatro abas, menu lateral, resultados, detalhe, avaliação e consulta. Conferidos DOM e screenshots em desktop e viewport de 390 × 844; sem extrapolar essa evidência para Android/iOS.

Uma resposta escrita no painel apareceu no atendimento do cidadão após recarregar. Apoio passou de zero para um e permaneceu após recarga. Consulta confirmou a escolha Acessibilidade. Cidadão e gestão coexistiram no mesmo navegador com cookies separados. Uma primeira inspeção encontrou bloqueio CORS de PUT; a configuração foi corrigida e ganhou teste de regressão antes de repetir a ação com sucesso.

## Revisões e dependências

Revisões independentes de API, clientes e integração orientaram correções de contrato, persistência, autorização, paginação, rascunhos, histórico auditável, imagens e proxy. A revisão focada dos três últimos P2 não encontrou pendências naquele escopo.

`npm audit`: API e painel com zero avisos; app com 31 (11 moderados, 20 altos, zero críticos). Foram aplicadas atualizações compatíveis; não executar `audit fix --force`: as sugestões restantes incluem versões incompatíveis de Expo/React Native. Atualização coordenada do SDK é pendência antes de publicação.

Oito skills oficiais Expo foram copiadas com licença, revisão fixada e hashes SHA-256 iguais à origem; veja `.agents/skills/SOURCE.md`. A chave Gemini legada não foi encontrada nos 118 arquivos dos primeiros bundles verificados; o código cliente não referencia essa chave.

## Limites e próximos checks de release

- Não executados: containers Docker, APK instalado, iOS, GPS/mapa nativo, seletor de fotos real, leitor de tela, fontes ampliadas e desempenho em release.
- Gemini real não foi chamado na validação. Fallback textual foi testado. A revisão automática rejeitou enviar imagens ao Google sem autorização específica; fotos permanecem no serviço da aplicação.
- Sem testes automatizados de componentes mobile ou percentual mínimo de cobertura estabelecido. A inspeção navegável cobre apenas as jornadas listadas.
- Sem push/deploy. Os serviços locais de validação não são instalação permanente; siga README para execução reproduzível.
- Armazenamento de anexos requer volume e backup; não há agendador para limpeza de órfãos/expiração de sessões. Sem push ou sincronização em tempo real.
