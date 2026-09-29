# Task 2 — Painel municipal web

Leia Task 2 e Global Constraints de plan/implementation/demo-v1.md e o contrato em plan/evidence/task-1-report.md. Implementar na main, sem branches ou subagentes. Relatório em plan/evidence/task-2-report.md.

## Interface

Criar municipal/ com React/Vite/TypeScript, pacote e lock próprios. Scripts de raiz municipal:dev e municipal:build. Excluir municipal do tsconfig mobile, mantendo a camada demo compartilhada verificável. Não introduzir backend, SSR, auth real ou chamadas de dados externas.

O painel representa a Prefeitura de Vila Esperança (fictícia), com marca Fiscaliza AI, navegação clara e identificação de demonstração. Trabalhar em português, com a paleta do spec e tipografia de sistema. Sem dependência de imagens/fontes remotas. Foco visual na fila e no caso em atendimento.

Layout desktop: identificação/navegação lateral, cabeçalho com contexto, indicadores derivados, busca/status/categoria e fila de ocorrências; detalhe ao lado ou abaixo com local e histórico. Em telas pequenas, empilhar sem perda de ações. Não exibir navegação para páginas inexistentes.

## Funcionalidades

- Adaptador localStorage para repositório da Task 1, chave fiscaliza:municipal:v1, com erros comunicados.
- Busca textual e filtros combináveis por status/categoria; contagem coerente com filtro; limpar filtros quando não houver resultados.
- Abrir detalhe pela fila, exibir endereço, prioridade, descrição e histórico de mudanças.
- Atualizar status com justificativa obrigatória; ação desabilitada durante salvamento e feedback persistente de sucesso ou erro. Lista, detalhe e resumo precisam refletir imediatamente o resultado.
- Cenários registered/in_progress/resolved e reset precisam de confirmação antes de descartar alterações. Mostrar que o app móvel não sincroniza.
- Incluir esquema local de localização identificado como ilustrativo, com marcadores acessíveis e lista equivalente. Sem mapa falso apresentado como cartografia real.
- Sem controles decorativos inativos, formulários sem labels ou feedback só por cor.

## Verificação

TDD para comportamento de busca/filtros e fluxo de atualização/persistência usando o repositório real. Build TypeScript/Vite. Executar no navegador quando possível; controller realizará revisão visual independente e fluxo status→reload. Relatar resultados reais, não atribuir aprovação visual sem observação.

## Organização

Separar componentes da fila, detalhe, resumo e controles de demonstração, estado/repositório e estilos. Evitar arquivo monolítico gigante. npm install permitido para dependências do painel, sem alterar versões móveis sem necessidade. Commit somente arquivos da tarefa; não incluir ledger ou outros documentos alterados pelo coordenador.
