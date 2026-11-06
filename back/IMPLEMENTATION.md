# API Fiscaliza aí

A API serve dados públicos do 1746/Data.Rio e autenticação de contas cidadãs. Não há painel, papel administrativo, reset de cenário ou endpoint HTTP para iniciar importações. A sincronização é executada por `npm run sync:rio1746` e `npm run sync:siurb` dentro de back, com as credenciais e limites do servidor.

Execute `npm run migrate` antes de iniciar. Migrações aplicadas são registradas com checksum e não devem ser alteradas. A migração 0013 converte antigos papéis de gestão/administração em contas cidadãs, revoga suas sessões e preserva contas e registros. A inicialização não executa seed e não cria contas. Contas existentes são preservadas; novos usuários utilizam o cadastro.

Contratos HTTP ficam em shared/contracts.ts. Autenticação usa token no aplicativo e cookie HttpOnly no navegador, com validação de origem nas escritas. Cadastro não aceita papel privilegiado. Alterações de município continuam validadas por CEP no servidor. Uploads de avatar validam assinatura, MIME e tamanho. O endpoint `DELETE /api/profile` permite ao cidadão autenticado excluir permanentemente sua conta, removendo registros de usuário, limpando mídias de avatar no disco e revogando em cascata todas as sessões ativas com HTTP 204.

Dados históricos e migrações de participação foram preservados, mas não oferecem jornadas ou endpoints ativos. Salvos são persistidos no aparelho; não há sincronização de salvos entre dispositivos.

Validação: npm run typecheck e npm test. A suíte de integração requer PostgreSQL e dependências nativas compatíveis com o ambiente.
