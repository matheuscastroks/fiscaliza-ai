# Sub-AGENTS: Módulo de Demonstração e Repositório Local (`demo/`)

Este documento orienta agentes que operam no diretório [`demo/`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/demo/).

---

## 1. Responsabilidade do Módulo

O diretório `demo/` implementa o motor de persistência offline e análise heurística do protótipo, permitindo execução 100% autônoma e determinística:
- [`repository.ts`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/demo/repository.ts): Repositório genérico sobre `AsyncStorage` (chave `fiscaliza:citizen:v1`), com controle de histórico, votação, comentários e reset por cenário.
- [`localAnalysis.ts`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/demo/localAnalysis.ts): Motor de análise local baseado em regex/palavras-chave em português.
- [`fixtures.ts`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/demo/fixtures.ts): Cenários pré-configurados para simulações e apresentações.
- [`types.ts`](file:///C:/Users/Matheus/Projects/fiscaliza-ai/demo/types.ts): Definições de tipo para cenários, estatísticas e opções de filtro.

---

## 2. Regras Estritas de Implementação

1. **Determinismo e Isolamento:**
   - O código dentro de `demo/` **não deve fazer chamadas de rede externas** nem depender de APIs de terceiros.
   - Os testes em `demo/*.test.ts` devem permanecer rápidos (< 1 segundo no total) e puros.

2. **Imutabilidade e Cópia Defensiva:**
   - Métodos que retornam dados do repositório (`get`, `list`, `getScenario`) **devem retornar cópias profundas**. Nunca retorne referências diretas ao estado interno, pois mutações externas violam a integridade dos dados.

3. **Tolerância a Falhas e Recuperação de Payload:**
   - Se os dados persistidos no `AsyncStorage` estiverem corrompidos ou com JSON inválido, o repositório deve se recuperar silenciosamente ou registrar aviso, retornando ao cenário base sem estourar exceções não tratadas na interface.

4. **Preservação de Histórico:**
   - Mudanças de status (`pending`, `in_progress`, `resolved`) exigem justificativa e devem registrar uma entrada em `statusHistory` sem perder campos pré-existentes.

---

## 3. Comandos de Verificação

Sempre que alterar qualquer arquivo em `demo/`:
```bash
npm test
```
**Critério de Aceitação:** Todos os testes unitários (`demo/repository.test.ts` e `demo/localAnalysis.test.ts`) devem passar com 0 falhas.
