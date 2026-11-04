# Remoção da participação legada

Escopo autorizado: remover do aplicativo as jornadas antigas de ocorrências, propostas, consultas e ações públicas. Preservar chamados 1746, equipamentos Data.Rio, salvos locais e canais oficiais.

- Remover rotas, formulários, comentários, apoios e componentes exclusivos dessas jornadas.
- Retirar contadores e histórico de participação do perfil e controles de apresentação.
- Restringir entradas territoriais a chamados oficiais e equipamentos.
- Remover o registro das rotas legadas da API, preservando tabelas e migrações históricas sem apagar registros.
- Validar tipos, lint, testes locais e API. Evidência web e dispositivo nativo dependem de execução nessas plataformas.

## Validação

- Testes locais: 8 arquivos demo e 19 arquivos de testes passaram.
- TypeScript do aplicativo: passou.
- Suíte API: impedida pelo módulo nativo sharp sem binário linux-x64 neste ambiente.
- Sem validação visual web ou em dispositivo nativo nesta execução.
