# Contas sem administração

Remover perfis admin/staff do contrato e do seed; manter apenas contas cidadãs. Retirar o endpoint POST /api/rio1746/sync. Importação continua pelos comandos do servidor, mantendo limites, locks e auditoria existentes.

Migração 0013 converte perfis anteriores em cidadãos e revoga suas sessões, sem excluir contas ou registros. A UI de CEP e perfil deixa de ter ramificações para gestão. A migração foi criada, sem aplicação em banco nesta execução.

Salvos continuam locais ao dispositivo; esta mudança não cria sincronização de salvos por conta.

Ajuste solicitado: remover também o seed de instalação, a conta de teste, o atalho de login e as variáveis de senha de demonstração. Docker passa a executar somente migrate e server. Contas já presentes não são apagadas.

Validação: testes locais passaram (3 arquivos TypeScript e 20 CJS); tipos e build do backend passaram. O teste isolado da migração em tabelas temporárias passou, sem aplicação da migração às tabelas da aplicação. Sem validação visual web/nativa.

TypeScript do app também passou. Lint interrompido após execução prolongada sem resultado; não foi considerado aprovado.
