# Fase 1 da revisão geral — privacidade, segurança e legado (13/11/2026)

Evidência: **C** = código e testes automatizados; **L** = ambiente local (Docker do PC, banco `fiscaliza_test`); **P** = produção.

## Legado da participação
- Tabelas `records`, `relations`, `answers` e `demo_engagement` estavam **vazias em produção** (P, contagem em 13/11). Dump guardado antes da remoção: `backups/legacy/participacao-20261113.dump` (fora do git). A migração `0019_remove_participation_legacy.sql` remove as tabelas, a coluna `users.sector` e zera os avatares que apontavam para `/api/demo-media` (2 contas em produção).
- Removidos: `historical-records.ts`; a busca `LIKE` em `records` na limpeza de fotos; a rota `/api/demo-media` e as imagens de demonstração (`avatar-admin.jpg`, `avatar-gestao.jpg`, `avatar-ana.jpg`); `GET /api/municipality`; `DELETE /api/profile` duplicado; o segundo nome de cookie de sessão; `sector` do contrato `SessionUser`; ilustrações de proposta e consulta no app; texto de permissão de fotos que falava de "evidência da ocorrência".
- **A migração ainda não foi aplicada em produção**: ela roda quando a imagem nova da API subir (antes do Node, como as demais).

## Conta e sessão
| Item | Comportamento | Evidência |
| --- | --- | --- |
| Token de sessão | O app nativo envia `X-Fiscaliza-Client: citizen-native` e recebe o token no corpo (SecureStore), sem cookie. O navegador recebe só o cookie httpOnly e nenhum token no corpo | C + L (`registration.test`) |
| Sessão deslizante | Sessão em uso com menos de 3,5 dias para vencer ganha mais 7 | C + L (`account-privacy.test`) |
| Bloqueio de login | 10 falhas por (e-mail, IP) bloqueiam só aquela rede; 100 por e-mail, em qualquer IP, bloqueiam a conta por 15 min | C + L (`auth-hardening.test`) |
| Limite de requisições | Com conta, por pessoa; sem conta, por IP (CGNAT das operadoras) | C |
| Apagar conta | Exige a senha (403 sem ela); o app pede a senha na folha de confirmação e, depois, apaga deste aparelho as chaves locais da conta (salvos, lugares, recorte, foto) | C + L (`hardening.test`, `auth-store.test`) |
| Sair da conta | O aparelho desregistra o token de push antes do logout (`DELETE /api/v1/notifications/register-token`, só para token da própria conta). "Sair em todos os celulares" apaga todos os tokens de aviso da conta | C + L (`account-privacy.test`, `notification-registration.test`) |
| Foto de perfil | `Cache-Control: private, no-store`: o CDN não guarda cópia depois de apagar a conta ou trocar a foto | C + L |

## Não verificado
- Fluxo no aparelho (apagar conta com senha, sair e não receber aviso): o S22 está em uso pela sessão da Fase 4; verificação no aparelho fica para depois dela.
- Um app nativo antigo (que envia `X-Fiscaliza-Client: citizen`) deixa de receber o token no login. Só existem builds de desenvolvimento, que carregam o JS novo do Metro.
