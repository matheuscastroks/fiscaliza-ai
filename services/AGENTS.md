# Serviços e integrações

A API compartilhada é a fonte de dados do produto. http.ts implementa transporte, sessão móvel SecureStore, cookie web e cache TanStack Query. auth.ts atende a autenticação via HTTP. Não há adaptador de ocorrências ou participação.

Respostas usam ApiResult<T> de shared/contracts.ts. Identidade e permissões são verificadas no backend. Não enviar userId como autoridade nem aceitar histórico pronto do cliente.

Uploads devem retornar URL durável. Falhas preservam rascunhos. Após mutação, invalidar consultas afetadas; não manter contadores independentes.

Verifique npm test, npx tsc --noEmit e npm run lint após alterações.
