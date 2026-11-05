# CI, merge automático e release

Push em uma branch deste repositório inicia o CI. Somente pushes autenticados de `matheuscastroks` (ID imutável `49662686`) podem gerar merge automático em `main`. Autor do commit não concede autorização. Forks, outros usuários e reexecuções por terceiros são recusados.

O CI roda testes, tipos, lint e exportação JavaScript Android; a API compila e testa em Node 22 e 24 com PostgreSQL 17 descartável. Também valida workflows e configuração de produção. A exportação Android não é APK nem substitui teste em dispositivo. Não há build ou publicação web nem publicação nas lojas.

Após sucesso, um controlador confiável da `main` verifica novamente usuário, execução, todos os jobs, regras e SHA atual. Abre um PR e faz squash somente desse commit. Respeita drafts, PRs encerrados e conflitos. A branch precisa conter a `main` atual; se ficar atrasada, atualize-a e faça novo push. Branches não são apagadas automaticamente.

## Ativação única

1. Integre esta alteração em `main` uma vez pelo fluxo atual. O controlador `workflow_run` precisa existir na branch padrão antes de funcionar. Execute o CI desta branch e confira seu resultado antes da integração inicial.
2. Em **Settings → Actions → General → Workflow permissions**, mantenha permissões padrão de leitura e habilite **Allow GitHub Actions to create and approve pull requests**.
3. Em **Settings → Rules → Rulesets**, importe `.github/rulesets/main.json`. O ruleset deve ficar **Active**, sem bypass, exigir PR sem aprovação e o check **CI gate** do GitHub Actions com branch atualizada. Ele também impede exclusão e force push em `main`. Se o check não aparecer, execute o CI uma vez primeiro.

Alternativa aos passos 2 e 3: com Node 24 e um token temporário do próprio proprietário no ambiente `GH_TOKEN`, execute `node .github/scripts/configure-repository.cjs`. A credencial precisa de Administration (write), Metadata (read) e acesso ao repositório. Não salve o token no repositório ou em secrets de execução. O script cria/atualiza somente o ruleset nomeado `Main CI owner`, preserva os demais e habilita criação de PRs pelo Actions. Confira regras existentes antes de executá-lo; regras adicionais continuam valendo.

O controlador recusa merges se as regras efetivas de PR e CI estrito não estiverem ativas. Usa o endpoint normal de merge, sem bypass. A lista de bypass é configurada vazia na ativação; o token de execução não tem Administration e o GitHub pode omitir essa lista da consulta. Confira alterações de bypass em Settings; o controlador não consegue auditar campos omitidos. O bloqueio por usuário se aplica à automação; o proprietário continua administrando as políticas do repositório. Testes verdes não garantem ausência de todos os bugs.

## Uso e recuperação

Depois da ativação: crie a branch a partir da `main` atual, trabalhe e faça push. O PR e o squash são automáticos após o CI passar. Para revisão antes do merge, abra um PR como draft antes do push.

O merge pelo `GITHUB_TOKEN` não dispara o workflow de push da release; por isso o controlador solicita explicitamente **Release API** via `workflow_dispatch`. A release valida novamente o código, publica somente a imagem da API no GHCR e faz deploy quando `VPS_DEPLOY_ENABLED=true`. Veja [deploy](../deploy/README.md).

Se a solicitação de release falhar depois do merge, reexecute **Merge owner branch** na `main`, informando `run_id` do CI de push original. PR já integrado não é recriado; a release da `main` atual é solicitada se ainda não houver uma em andamento ou bem-sucedida. Para falhas de build/deploy, também é possível reexecutar **Release API** na `main`.

O CI usa `push`, sem execução adicional em `pull_request`: isso evita duplicação e a aprovação manual exigida para workflows disparados por PR criado pelo `GITHUB_TOKEN`. PRs externos não entram neste fluxo automático.

Verificação local da automação: `node --test .github/tests/*.test.cjs`. Os jobs de teste têm token de leitura e checkout sem credenciais persistidas. O controlador com escrita só executa código da branch padrão, sem baixar artefatos ou executar código da branch candidata.

Referências: [eventos de workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run), [eventos com GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token), [merge com SHA esperado](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request).
