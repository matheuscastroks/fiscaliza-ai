# Limpeza de mocks e legado

Escopo: eliminar o mockData, estatísticas fictícias de sessão, persistência do protótipo, funções e testes exclusivos das jornadas retiradas. Usar SessionUser na autenticação; preservar uploads de avatar, consultas oficiais e salvos.

O módulo backend de participação, seus seeds e análise Gemini foram removidos. Variáveis Gemini saíram dos templates e do Compose. Migrações e tabelas históricas permanecem; tipos dos JSONs persistidos ficam isolados em backend/src/historical-records.ts e não integram o contrato HTTP atual.

Testes puros de território e sessão foram movidos de demo para tests. Testes de autenticação, segurança, migrações, fontes oficiais e seed de instalação foram preservados/adaptados. A coleção Postman não oferece os endpoints retirados.

Validação: testes locais e verificações de tipos do app/API executados; sem validação visual web ou dispositivo nativo. A suíte API depende do binário Linux de sharp e PostgreSQL para os casos de integração.

Resultados: npm test passou (3 arquivos de testes TypeScript e 20 arquivos CJS); teste focado de autenticação e remoção passou; tsc do app, typecheck e build do backend passaram. Testes de catálogo SIURB e schema territorial passaram. O teste de paginação foi bloqueado pelo sharp sem binário linux-x64.
