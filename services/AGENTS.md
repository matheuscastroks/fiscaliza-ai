# Serviços e integrações

A API compartilhada é a fonte de dados do produto. http.ts implementa transporte, sessão móvel SecureStore, cookie web e cache TanStack Query. mockApi.ts é adaptador temporário para telas antigas; não deve voltar a inventar sucesso local.

Respostas usam ApiResult<T> de shared/contracts.ts. Identidade e permissões são verificadas no backend. Não enviar userId como autoridade nem aceitar histórico pronto do cliente.

Gemini existe exclusivamente no backend, usa descrição textual, timeout e fallback heurístico. Não ler EXPO_PUBLIC_GEMINI_API_KEY, converter fotos para envio ao Google ou dizer que fotos foram analisadas. Exports legados de aiService.ts mantêm apenas compatibilidade local.

Uploads devem retornar URL durável. Falhas preservam rascunhos. Após mutação, invalidar consultas afetadas; não manter contadores independentes.

Verifique npm test, npx tsc --noEmit e npm run lint após alterações.
