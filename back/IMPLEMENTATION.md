# API Fiscaliza aí

A API serve dados públicos do 1746/Data.Rio e autenticação de contas cidadãs. Não há painel, papel administrativo, reset de cenário ou endpoint HTTP para iniciar importações. A sincronização é executada por `npm run sync:rio1746` e `npm run sync:siurb` dentro de back, com as credenciais e limites do servidor.

Execute `npm run migrate` antes de iniciar. Migrações aplicadas são registradas com checksum e não devem ser alteradas. A migração 0013 converte antigos papéis de gestão/administração em contas cidadãs, revoga suas sessões e preserva contas e registros. A inicialização não executa seed e não cria contas. Contas existentes são preservadas; novos usuários utilizam o cadastro.

Contratos HTTP ficam em `shared/contracts.ts`, `shared/public-data.ts`, `shared/official-map.ts` e `shared/registration.ts`. Autenticação usa token no aplicativo e cookie HttpOnly no navegador, com validação de origem nas escritas. Cadastro não aceita papel privilegiado. Alterações de município continuam validadas por CEP no servidor. Uploads de avatar validam assinatura, MIME e tamanho. O endpoint `DELETE /api/auth/profile` (com confirmação de `password` no corpo e limite de taxa) permite ao cidadão autenticado excluir permanentemente sua conta, removendo registros de usuário, limpando mídias de avatar no disco e revogando em cascata todas as sessões ativas. Responde HTTP 200 com o envelope `{ success: true, data: null }`; trocar o avatar também apaga a foto anterior.

Chamados salvos sem conta ficam apenas no aparelho; com conta autenticada e município definido, são sincronizados no servidor (`GET /api/v1/saved-calls`, `PUT /api/v1/saved-calls/:callId`, `POST /api/v1/saved-calls/merge` para adoção em lote de até 200 itens no login, `DELETE /api/v1/saved-calls/:callId` e `DELETE /api/v1/saved-calls`, até 500 por conta). A API também expõe `GET /api/rio1746/map` (agregação espacial por viewport sem paginação) e `GET /api/health/deep` (idade da última sincronização bem-sucedida por fonte).

Scripts de migração históricos (`0001`–`0020`) são preservados; a migração `0019_remove_participation_legacy.sql` removeu as tabelas vazias de participação legada (`records`, `relations`, `answers`, `demo_engagement`) e `users.sector` após dump de segurança.

Validação: npm run typecheck e npm test. A suíte de integração requer PostgreSQL e dependências nativas compatíveis com o ambiente.
