# Desempenho: entrega incremental

Escopo autorizado após a auditoria: reduzir o custo de busca e carregamento sem alterar fontes, autenticação ou significado dos dados.

1. Trocar o carregamento cumulativo de 300/600/900 chamados por páginas de 50, com cursor estável por data e protocolo. Manter paginação antiga para consumidores existentes. A primeira página informa o total; continuações dispensam COUNT.
2. Indexar a ordenação e os seis campos da busca textual preservando sua semântica. Validar a migração e o plano de execução em banco isolado.
3. Respeitar o prazo do cache do cliente ao retornar às telas; manter atualização manual. Impedir requisições simultâneas de continuação e misturas entre filtros.
4. Testar contrato, empates na ordenação, cursor inválido, mudanças de filtro, ausência de duplicação e compatibilidade. Verificar tipos, lint e testes existentes.

Próximas entregas da auditoria: DTO compacto com proveniência compartilhada, agregações específicas de bairro e cache de servidor com revisão de publicação. Não adicionar Redis nem ampliar pools sem medições que justifiquem.

Validar em banco isolado antes de atualizar a API local. Salvar backup e conferir a preservação dos dados ao aplicar a migração localmente. Não publicar no remoto. Evidência de código/web não substitui medição no aparelho Android.

## Progresso

- Etapas 1–4 implementadas; 61 testes de backend e 74 testes locais passaram. O teste focado de cursor foi repetido após reforçar a validação de datas.
- Banco isolado: 27.811 chamados reais; busca/contagem 189,146 → 16,204 ms; página distante por OFFSET 66,507 ms e por cursor 0,414 ms. Medições únicas de SQL, sem inferência de FPS.
- Chrome, largura de 390 px: duas páginas de 50, 100 IDs distintos, nenhum recarregamento no retorno imediato; posição da lista 700 → 674 px. Nenhum erro de página.
- Exportação web, tipos e lint direcionado passaram. Backup anterior à atualização local: 5.292.640 bytes em diretório ignorado pelo Git.
- API local atualizada e verificada: health 200, migração registrada e continuação de busca funcionando. Contagens e hashes de contas/registros preservados. Sem push; novas alterações permanecem locais.
