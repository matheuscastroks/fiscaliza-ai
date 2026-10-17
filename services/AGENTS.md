# Sub-AGENTS: Camada de Serviços e Integrações (`services/`)

Este documento orienta agentes que operam no diretório [`services/`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/services/).

---

## 1. Responsabilidade do Módulo

O diretório `services/` faz a ponte entre a interface do usuário e as fontes de dados / inteligência artificial:
- [`aiService.ts`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/services/aiService.ts): Serviço de análise inteligente com Google Gemini (REST) e fallback local.
- [`mockApi.ts`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/services/mockApi.ts): Interface de acesso a dados (problemas, usuários, autenticação) tipada com contratos `ApiResponse<T>`.

---

## 2. Regras Estritas de Implementação

1. **Princípio do Fallback Obrigatório (Resiliência):**
   - Nenhuma chamada a API externa (como Google Gemini) pode bloquear o fluxo do cidadão.
   - Caso não haja chave no ambiente (`EXPO_PUBLIC_GEMINI_API_KEY` ou `GEMINI_KEY`), o dispositivo esteja offline ou a API retorne erro, a função **deve cair de forma transparente no fallback local** (`analyzeLocally`).
   - A tela de denúncia [`ReportScreen.tsx`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/app/%28tabs%29/ReportScreen.tsx) deve sempre receber uma sugestão válida de categoria, prioridade e título.

2. **Tipagem e Contrato `ApiResponse<T>`:**
   - Métodos em [`mockApi.ts`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/services/mockApi.ts) devem retornar sempre o objeto estruturado:
     ```typescript
     export interface ApiResponse<T> {
       success: boolean;
       data?: T;
       error?: string;
     }
     ```
   - Nunca propague exceções cruas para os componentes. Capture erros com `try/catch` e converta para `{ success: false, error: ... }`.

3. **Retrocompatibilidade de Assinaturas:**
   - Mantenha os exports legados exportados por convenção (`analyzeWithAI`, `analyzeWithRealAI`, `analyzeWithGemini`, `imageToBase64`), para garantir que telas antigas não quebrem durante migrações ou refatorações graduais.

---

## 3. Comandos de Verificação

Após qualquer alteração em `services/`:
```bash
npx tsc --noEmit
npm test
```
**Critério de Aceitação:** Zero erros de tipagem no TypeScript e todos os 12 testes do projeto passando.
