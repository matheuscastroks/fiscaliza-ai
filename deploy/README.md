# Publicação em VPS

O CI valida o app, a API com PostgreSQL e o painel. Na `main`, `release.yml` reutiliza essas verificações, publica três imagens no GHCR com o SHA completo do commit e faz deploy por SSH somente quando `VPS_DEPLOY_ENABLED=true`. Sem VPS, imagens são geradas e o job de deploy é pulado. Não há publicação Android/iOS nas lojas.

## Preparar o servidor uma vez

Use Linux x86_64 com Docker Engine, plugin Compose v2 com suporte a `up --wait`, Bash, curl, tar e flock. Reserve inicialmente 2 vCPU e 4 GB de RAM; ajuste conforme uso. As imagens são compiladas no GitHub, não na VPS.

1. Aponte os registros DNS de `app.seudominio.com.br` e `gestao.seudominio.com.br` para o IP. Se houver registro AAAA, ele também precisa apontar para este servidor. Libere TCP 80/443 e SSH. O Compose não publica PostgreSQL nem API diretamente.
2. Crie um usuário de deploy e configure uma chave SSH exclusiva para o GitHub Actions. O usuário precisa executar Docker e escrever em `/opt/fiscaliza-ai`. Acesso ao grupo Docker equivale a administração do host; use chave dedicada.
3. Crie a pasta e o arquivo de ambiente, substituindo `deploy` pelo usuário escolhido:

```sh
sudo mkdir -p /opt/fiscaliza-ai/releases
sudo chown -R deploy:deploy /opt/fiscaliza-ai
# Copie deploy/.env.production.example para /opt/fiscaliza-ai/.env.production.
chmod 600 /opt/fiscaliza-ai/.env.production
openssl rand -hex 32
```

Preencha os dois domínios sem `https://` e sem barra, a senha do banco e `DEMO_PASSWORD`. Use uma senha hexadecimal para PostgreSQL, pois ela entra em uma URL de conexão. Não altere a senha do banco já inicializado apenas editando esse arquivo. O seed não altera senhas de contas existentes. Gemini é opcional e fica somente no servidor.

4. Autorize o servidor a baixar as imagens. Pacotes GHCR podem ser privados mesmo em repositório público: faça `docker login ghcr.io -u SEU_USUARIO` na VPS usando um token com `read:packages` e acesso aos três pacotes. Alternativamente, torne os pacotes públicos e confira o pull anônimo. O workflow publica com `GITHUB_TOKEN`; ele não instala credenciais de registry na VPS.

## Configurar o GitHub

Crie o environment `production`. Em **Settings → Secrets and variables → Actions**, adicione os secrets no environment ou repositório:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP ou hostname SSH da VPS |
| `VPS_USER` | Usuário de deploy |
| `VPS_PORT` | Porta SSH; opcional, padrão 22 |
| `VPS_SSH_KEY` | Chave privada dedicada, sem passphrase, correspondente à chave autorizada |
| `VPS_KNOWN_HOSTS` | Linha known_hosts do servidor, com fingerprint conferida pelo console do provedor |

Para porta diferente de 22, known_hosts deve identificar `[host]:porta`. Não aceite uma chave de host sem conferir sua fingerprint. Nenhum workflow usa `StrictHostKeyChecking=no`.

Adicione **a variável do repositório** `VPS_DEPLOY_ENABLED=true` somente após preparar DNS, ambiente, registry e SSH. Ela é avaliada antes de abrir o environment. Regras de aprovação opcionais podem ser configuradas no environment `production`.

Faça push na `main` ou execute **Actions → Release web platform → Run workflow** selecionando `main`. Não use workflow de PR para publicar. Os testes de API usam banco descartável; nunca a base da VPS.

## Operação e recuperação

Caddy emite e renova HTTPS automaticamente. Cidadão: `https://PUBLIC_DOMAIN`; gestão: `https://MUNICIPAL_DOMAIN`. Ambos acessam `/api` na própria origem. Banco, uploads e certificados possuem volumes persistentes. Dados e contas continuam sendo de apresentação; não representam atendimento oficial de uma prefeitura.

O deploy espera os healthchecks, confere HTTPS, API/banco e páginas de login, e só então grava `/opt/fiscaliza-ai/current-release`. Uma falha fica vermelha no Actions; o serviço pode ter sido parcialmente atualizado e requer inspeção. Não há rollback automático de banco.

Mantenha backups fora da VPS do PostgreSQL e do volume de uploads, antes de atualizar, e teste restauração. Não execute `docker compose down -v` em produção. Para voltar ao código de uma release já enviada e compatível com as migrações atuais:

```sh
bash /opt/fiscaliza-ai/releases/SHA_ANTERIOR/deploy/deploy.sh ghcr.io/matheuscastroks/fiscaliza-ai SHA_ANTERIOR
```

Use o SHA completo de 40 caracteres. Migrações já aplicadas permanecem; alterações incompatíveis exigem recuperação planejada com backup. Releases antigas e imagens não são apagadas automaticamente.

## Validação desta entrega

A configuração pode ser conferida sem publicar: `bash -n deploy/deploy.sh`, parsing dos workflows e `docker compose -f compose.production.yaml config --quiet` com variáveis de exemplo. O CI também confere Compose e sintaxe do Caddy. Execução completa de containers, GitHub Actions, certificado e SSH exige Docker/servidor disponíveis; não foi comprovada localmente nesta entrega.

Em 17/10/2026 passaram: actionlint 1.7.12 nos dois workflows (binário oficial com SHA-256 conferido), parsing YAML, encadeamento validação → imagens → deploy, ausência de portas públicas em banco/API e sintaxe Bash com rejeição de argumentos inválidos. A suíte do backend também passou com 15 testes, zero falhas e zero pulados, em uma base PostgreSQL nova usando DEMO_PASSWORD=validation-ci-only. O CI/CD ainda não foi executado no GitHub.

Referências: [Compose em produção](https://docs.docker.com/compose/how-tos/production/), [secrets do Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets) e [proxy Caddy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
