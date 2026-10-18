# Validação do vínculo municipal

Verificação local em 17/10/2026, na branch `feat/participacao-urbana`. Este registro atualiza os resultados de `11-validacao-integrada.md` após a implementação do onboarding por CEP.

## Evidências

| Verificação | Resultado |
|---|---|
| `npm test` | 17 testes passaram |
| `npx tsc --noEmit` e `npm run lint` | Passaram |
| `npm test --prefix backend` com PostgreSQL real | 15 testes passaram, sem falhas ou testes pulados |
| Geração OpenAPI, migração e seed | Passaram em banco de apresentação separado |
| Testes e build do painel municipal | 3 testes passaram; TypeScript e Vite passaram |
| Postman CLI local | 26 requisições e 53 assertions passaram, sem publicação na nuvem |
| Exportação Android | Bundle Hermes gerado; não equivale a APK ou execução em dispositivo |
| Exportação web | Bundle e 31 rotas estáticas gerados, incluindo `MunicipalityScreen` |
| Compose e workflow CI | YAML parseado; execução Docker/GitHub ainda pendente |

A coleção Postman consultou o CEP `20010-000` pelo ViaCEP com cache inicialmente vazio, confirmou Rio de Janeiro/RJ, rejeitou município divergente e percorreu o ciclo cidadão–gestão–avaliação. O banco de testes é separado do banco de apresentação; respostas sintéticas usadas nos testes não sustentam a evidência da consulta pública.

## Regressões cobertas

- Isolamento territorial de consultas, mutações, vínculos, anexos e restauração de cenários; histórico anterior preservado.
- Localização confrontada com Polygon/MultiPolygon municipal, incluindo limites e exclusão de áreas internas.
- Alteração de município serializada com gravações; cancelamentos de JSON, multipart e espera por lock testados com conexões TCP reais.
- Migrações registradas por nome e SHA-256, sem repetir backfills em reinicializações. Arquivos SQL normalizados em LF.
- Confirmação de perfil tardia não restaura logout nem sobrescreve outra sessão; caches e rascunhos separados por usuário e município.

Revisões independentes verificaram as correções de sessão, cancelamento e migrações sem novos achados nesse escopo.

## Fontes e limites

CEP é referência territorial, não comprovação de residência. Gestão recebe o município da conta autorizada. A malha oficial do Rio possui origem e hash em `backend/data/README.md`.

Referências: [ViaCEP](https://viacep.com.br/) e [malhas IBGE v3](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3).

A automação de navegador apresentou timeout; o novo onboarding não teve inspeção visual concluída. A evidência visual anterior, em `11-validacao-integrada.md`, antecede essa tela. GPS, câmera, leitores de tela e execução Android/iOS continuam pendentes.

A auditoria anterior das dependências registrou 31 avisos no app (11 moderados e 20 altos), zero na API e no painel. Não foi executado `audit fix --force`; a atualização coordenada do Expo permanece pendente antes de publicação. Nenhum push ou deploy faz parte desta entrega.
