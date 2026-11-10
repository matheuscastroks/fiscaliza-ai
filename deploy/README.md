# Publicação da API com Cloudflare Tunnel

O CI valida o app móvel e a API. A release publica somente a imagem `ghcr.io/matheuscastroks/fiscaliza-ai-api:SHA` e faz deploy por SSH quando `VPS_DEPLOY_ENABLED=true`. Sem essa variável, publica a imagem e pula o deploy. Não há publicação web nem nas lojas. A ativação do merge automático está em [CI/CD](../.github/README.md).

## Modo público no PC (enquanto não há VPS)

`docker compose up` comum **não** liga o túnel e roda a API em modo de desenvolvimento. Para publicar o domínio a partir do PC, use o override endurecido:

```sh
docker compose -f compose.yaml -f compose.public.yaml --profile public up -d
```

Ele liga o `cloudflared` (versão fixada), roda a API com `NODE_ENV=production` (CORS só para `https://$PUBLIC_DOMAIN`, cookie de sessão `Secure`, sem origens `null`, LAN ou `exp://`) e limita o tamanho dos logs. A API recusa subir em produção sem `DATABASE_URL`, `WEB_ORIGINS` e `TRUST_PROXY`, e recusa a senha de exemplo do banco.

Antes da primeira vez, no `.env.compose` (nunca versionado):

1. Defina `POSTGRES_PASSWORD` próprio (`openssl rand -hex 32`). Em um banco já criado, troque também a senha dentro do Postgres: `docker compose exec postgres psql -U fiscaliza -d fiscaliza -c "ALTER USER fiscaliza PASSWORD 'NOVA_SENHA'"`. Só editar o arquivo não muda a senha de um banco existente.
2. Use `API_BIND=127.0.0.1`. Com `0.0.0.0` a API fica aberta na rede local sem passar pelo túnel.
3. Defina `PUBLIC_DOMAIN` e `CLOUDFLARE_TUNNEL_TOKEN`.

O compose de desenvolvimento não traz mais o domínio público em `WEB_ORIGINS`. Com `--profile public` sobem também o `scheduler` e o `backup` descritos abaixo.

## Imagem, migrações e sinais
A imagem da API é feita em dois estágios (compila e depois copia só `dist/`, as migrações e os dados; sem testes nem fontes) com base fixada por digest e `HEALTHCHECK`. O processo principal é o Node, então `docker stop` encerra a API na hora. As migrações rodam no serviço de uma execução `migrate` (Compose local) ou antes do Node no `command` da API (Compose de produção, para funcionar com `up --wait`).

## Backup e restauração
O serviço `backup` (perfil `public` no PC; sempre ligado na VPS) faz, todo dia depois das 2h de Brasília, um `pg_dump -Fc` e um `tar` dos uploads em `BACKUP_DIR` (padrão `./backups`; na VPS `/opt/fiscaliza-ai/backups`), mantendo 7 cópias diárias e 4 semanais (domingos). O arquivo só aparece completo (escrita em temporário e renomeação). **Copie essa pasta para fora do computador** (OneDrive, Google Drive ou outro disco): sem isso, uma falha de disco perde tudo.

Para restaurar num banco novo e conferir:

```sh
deploy/restore.sh backups/daily/fiscaliza-AAAAMMDD-HHMMSS.dump backups/daily/uploads-AAAAMMDD-HHMMSS.tar.gz
# banco restaurado em "fiscaliza_restore"; confira e apague com
docker compose exec postgres psql -U fiscaliza -d postgres -c 'DROP DATABASE fiscaliza_restore'
```

Para substituir a produção, pare a API, rode com `DB=fiscaliza` (o script pede a palavra SUBSTITUIR) e suba de novo. Restauração testada em 10/11/2026 no ambiente local: backup da base de desenvolvimento restaurado em banco descartável, com as mesmas contagens (30 usuários, 27.814 chamados, 4 anexos, 1 município), e o tar dos uploads listado. Não foi testada na VPS.

## Sincronização agendada
O serviço `scheduler` (mesma imagem) roda no horário de Brasília: `rio1746` às 4h (os últimos `RIO1746_SYNC_DAYS` dias fechados, padrão 2; avisa quem segue chamados que mudaram de situação), `siurb` aos domingos às 5h e limpeza de sessões vencidas às 3h30. Ao subir, não repete o que já passou do horário no dia. Precisa de uma credencial de service account do BigQuery em `BIGQUERY_CREDENTIALS_FILE` (padrão `./secrets/bigquery.json` no PC; `/opt/fiscaliza-ai/secrets/bigquery.json` na VPS) e de `GCP_PROJECT_ID`. O arquivo deve existir mesmo que ainda esteja vazio (`{}`); sem credencial válida a tarefa falha e fica registrada no log. O lock por fonte impede sobreposição com execuções manuais.

## Monitoramento
Crie dois monitores gratuitos de "job" no Healthchecks.io (um para a sincronização, outro para o backup) e coloque as URLs de ping em `HEALTHCHECK_SYNC_URL` e `HEALTHCHECK_BACKUP_URL`; o agendador chama a URL ao concluir e `/fail` ao falhar, e o monitor alerta quando o ping para de chegar. Para a API, aponte um monitor externo (UptimeRobot, por exemplo) para `https://<domínio>/api/health`. Não criei esses monitores: dependem da sua conta.

O Compose local já possui `cloudflared`. Nos logs consultados em 05/11/2026, a configuração recebida da Cloudflare aponta `fiscalizaai.matheuscastroks.com.br` para `http://api:3001`, com fallback `http_status:404`. O healthcheck público `/api/health` respondeu 200 OK. O Compose de produção usa os mesmos nomes de serviço e porta para preservar essa rota. A configuração remota do túnel não foi alterada.

## Preparar o servidor uma vez

Use Linux x86_64 com Docker Engine, Compose v2 com `up --wait`, Bash, curl, tar e flock. As imagens são compiladas no GitHub. O túnel faz conexões de saída: esta configuração não publica portas de API, banco ou proxy, nem usa Caddy em produção. HTTPS é fornecido pela Cloudflare.

1. Confira no painel Cloudflare que o hostname é `fiscalizaai.matheuscastroks.com.br` e o serviço do túnel é `http://api:3001`.
2. Prepare um usuário de deploy com chave SSH exclusiva, permissão para executar Docker e escrever em `/opt/fiscaliza-ai`. Libere o acesso SSH. O grupo Docker equivale à administração do host.
3. Crie `/opt/fiscaliza-ai/releases` e copie `deploy/.env.production.example` para `/opt/fiscaliza-ai/.env.production`. Proteja o arquivo com `chmod 600` e configure `PUBLIC_DOMAIN`, `CLOUDFLARE_TUNNEL_TOKEN` e `POSTGRES_PASSWORD`. O token fica nesse arquivo da VPS, não no Git. Use senha hexadecimal (`openssl rand -hex 32`), pois ela entra na URL do banco. Não altere a senha de um banco inicializado apenas editando o arquivo.
4. Autorize o pull no GHCR. Se a imagem for privada, faça `docker login ghcr.io -u SEU_USUARIO` na VPS com token `read:packages`; alternativamente, torne o pacote público e confira o pull anônimo. O workflow publica com `GITHUB_TOKEN`, mas não instala credenciais de registry no servidor.

Se estiver movendo a aplicação do Docker local para uma VPS, migre e confira banco e uploads antes da troca. As chaves de volume locais (`fiscaliza_postgres`, `fiscaliza_uploads`) diferem das de produção (`postgres`, `uploads`). Com o projeto `fiscaliza-ai`, os volumes Docker de produção se chamam `fiscaliza-ai_postgres` e `fiscaliza-ai_uploads`; não há migração automática dos dados locais. Encerre o conector antigo quando concluir a migração para evitar enviar tráfego para duas instalações com bases diferentes. Esta alteração não reinicia os containers locais nem transfere dados.

## Configurar o GitHub

Crie o environment `production`. Em **Settings → Secrets and variables → Actions**, adicione os secrets no environment ou repositório:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP ou hostname SSH da VPS |
| `VPS_USER` | Usuário de deploy |
| `VPS_PORT` | Porta SSH; opcional, padrão 22 |
| `VPS_SSH_KEY` | Chave privada dedicada, sem passphrase |
| `VPS_KNOWN_HOSTS` | Linha known_hosts com fingerprint conferida pelo console do provedor |

Para porta diferente de 22, known_hosts deve identificar `[host]:porta`. Nenhum workflow desabilita a verificação da chave do servidor. O token do túnel não precisa estar no GitHub: permanece na VPS.

Defina a variável **do repositório** `VPS_DEPLOY_ENABLED=true` somente depois de preparar servidor, ambiente, túnel, registry e SSH. Aprovações configuradas no environment `production` continuam valendo.

Use o merge automático, que solicita **Release API**, ou execute esse workflow manualmente selecionando `main`. A release valida novamente o app e a API com banco descartável antes de publicar. Ela não atualiza automaticamente o Docker da sua máquina de desenvolvimento.

## Operação e recuperação

No app, use `EXPO_PUBLIC_API_URL=https://fiscalizaai.matheuscastroks.com.br/api`. O túnel encaminha as requisições diretamente à API. Banco e uploads têm volumes persistentes. Containers antigos fora da configuração, como o cidadão web, são removidos por `--remove-orphans`; volumes não são apagados.

O deploy serializa execuções, aguarda os healthchecks, confere `/api/health` no domínio público e só então grava `/opt/fiscaliza-ai/current-release`. A verificação pública depende da rota Cloudflare e de suas políticas permitirem esse endpoint. Uma falha pode deixar serviços parcialmente atualizados; confira os logs. Não há rollback automático do banco.

Mantenha backups externos de banco e uploads e teste a restauração. Não use `docker compose down -v` para atualizar. Para voltar a uma release já publicada e compatível com as migrações atuais:

```sh
bash /opt/fiscaliza-ai/releases/SHA_ANTERIOR/deploy/deploy.sh ghcr.io/matheuscastroks/fiscaliza-ai SHA_ANTERIOR
```

Use SHA completo de 40 caracteres. Migrações aplicadas permanecem. Releases e imagens antigas não são apagadas automaticamente.

## Validação

Confira `bash -n deploy/deploy.sh`, `npm run test:automation`, actionlint nos três workflows e `docker compose -f compose.production.yaml config --quiet` com variáveis fictícias, incluindo o token do túnel. Não rode esse Compose de validação contra a base pessoal. Merge no GitHub e deploy SSH em VPS não foram executados nesta entrega.

Referências: [túnel gerenciado remotamente](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel-api/), [Compose em produção](https://docs.docker.com/compose/how-tos/production/) e [secrets do Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
