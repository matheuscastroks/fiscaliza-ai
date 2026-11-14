# Revisão do Dependabot — 14/11/2026

Revisão e limpeza autorizadas pelo usuário, incluindo branches locais e remotas.

## Atualizações selecionadas

- Backend: Fastify 5.12.8 (correção de segurança anunciada pelo projeto), cookie 11.1.5, cors 11.4.1, swagger 9.9.3 e BigQuery 9.6.1. PRs de origem: #13, #14, #20, #15 e #27. Lockfile refeito sobre main para resolver conflitos sem regredir dependências; fast-uri atualizado no intervalo compatível para incorporar sua correção transitiva.
- Automação: checkout 7.0.1, setup-node 7.1.0, upload-artifact 7.0.2, login-action 4.8.0, build-push-action 7.4.0 e setup-buildx-action 4.4.1. PRs de origem: #5, #11, #10, #9, #8 e #7. SHA completo preservado; execução em runners Ubuntu hospedados. setup-node usa runtime Node24, independente da matriz de Node22/24 das aplicações.
- As propostas foram consolidadas numa única alteração para testar o resultado combinado. Os PRs originais serão encerrados como substituídos após integração, não considerados versões descartadas.

## Propostas descartadas

#12 AsyncStorage3, #16 Babel8, #18 rate-limit11, #19 TypeScript7, #22 ESLint10, #25 Node25 e #26 grupo React/nativo. Exigem migração coordenada ou divergem da configuração validada. O grupo #26 altera React e react-dom sem alinhar react-test-renderer e muda módulos nativos além de bundledNativeModules do SDK58 instalado.

Dependabot passa a respeitar as majors de rate-limit, Babel, TypeScript, ESLint e Node adotadas. React e bibliotecas nativas listadas são mantidas pelo fluxo Expo install/upgrade para preservar o alinhamento do SDK. Atualizações compatíveis dos demais pacotes e automação continuam propostas normalmente.

## Validação e integração

Exigir suíte da API com PostgreSQL isolado, tipos/lint e testes de automação, além do CI completo do commit final (app, Expo compatibility, API Node22/24, imagem Docker e automação). Não aplicar npm audit fix --force: o relatório restante apontava dependências de desenvolvimento e sugeria downgrade incompatível do parser/plugin TypeScript-ESLint.

O worktree antigo da fase4 foi preservado e deixado em HEAD destacado antes de remover sua branch, cujo conteúdo já estava em main. Nenhum diretório de trabalho foi removido. Branches integradas e branches dos PRs descartados são removidas; main é preservada.


## Decisão posterior do usuário: desativação completa — 14/11/2026

Após o merge do PR #28 e CI aprovado (90 testes locais de backend também passaram), o usuário solicitou remover o Dependabot. A configuração .github/dependabot.yml foi removida, assim como a exceção que autorizava o bot no CI. Os PRs e branches novos do bot são encerrados/removidos e suas execuções em andamento canceladas. Atualizações de dependências passam a ser manuais. As atualizações já integradas e os testes próprios do projeto permanecem. Os alertas de vulnerabilidade e as correções automáticas do Dependabot já estavam desabilitados no GitHub, conforme consulta às configurações do repositório.
