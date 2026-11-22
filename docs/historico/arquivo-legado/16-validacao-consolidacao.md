# Validação da consolidação territorial

Executada em 17–18/10/2026, sobre `main` a partir de `285d7a5`. A navegação, ícones, menu lateral e tokens visuais estão sendo alterados pelo usuário em outra sessão; esses arquivos foram preservados e excluídos dos commits desta entrega. Builds e capturas refletem o checkout naquele instante, não certificam alterações concorrentes posteriores.

## Evidências executadas

| Verificação | Resultado |
| --- | --- |
| App: `npm test` | 28 testes, zero falhas |
| App: `npx tsc --noEmit` | Aprovado |
| App: `npm run lint` | Zero erros; aviso BOM de CityScreen corrigido e arquivo revalidado com zero avisos |
| API: `npm test --prefix backend` | 22 testes, zero falhas ou skips, PostgreSQL real em banco exclusivo |
| Contrato: `npm run openapi --prefix backend` | Gerado sem erro |
| Painel: testes, TypeScript e build Vite | 6 testes aprovados e build concluído |
| Exportação Expo web | 32 rotas estáticas geradas |
| Exportação Expo Android | Bundle Hermes gerado; não é APK nem execução nativa |
| Postman CLI local | 26 requisições, 53 assertions, zero falhas; sem publicação na nuvem |
| Detector Impeccable nos alvos de UI alterados | Lista vazia de achados |
| Revisão independente | Bloqueio do PATCH cívico corrigido e reconferido; sem outros P1/P2 nos arquivos revisados |

Os testes de API cobrem escopo municipal/bairro/local, polígono real em vez de apenas bounding box, auditoria de mudança territorial combinada com decisão, dez gestores gravando localizações simultaneamente, origem de eventos, indicadores por bairro e autorização de histórico anterior por autoria/participação. O banco de teste é distinto dos bancos de demonstração.

A coleção Postman parametriza `webOrigin`, mantendo `http://localhost:5173` como padrão. No ambiente isolado desta validação foram usados API `localhost:3002/api` e origem `http://localhost:8085`. Uma execução inicial usou a origem padrão não permitida e recebeu 403; a execução final com origem autorizada passou sem relaxar a API. O CLI informa ausência de credencial de publicação; não houve login nem envio de relatórios.

## Jornada em navegador

Chrome headless 155, cidadão em viewport 390×844 e painel em 1440×1000, com contas próprias do seed e banco `fiscaliza_consolidation_preview`:

- Login da cidadã, busca real do CEP 20010-000 no serviço e confirmação de Rio de Janeiro/RJ.
- Abertura de Home, Território em lista, Resultados, Município e proposta; inspeção de capturas mobile e desktop.
- Gestão alterou decisão e abrangência da proposta. O PATCH retornou 200 e o request não continha o campo legado `neighborhood`, que o contrato de edição rejeita.
- Gestão encaminhou e concluiu a ocorrência de iluminação com setor e justificativas. A cidadã reabriu a Home, recebeu o destaque de conclusão e confirmou a solução no detalhe.
- Painel mostrou ocorrências, propostas, consultas e ações na mesma tabela por bairro, com total municipal separado. Zero erros JavaScript nas jornadas concluídas.

As capturas e ferramentas temporárias estão em `.validation/`, ignorado pelo Git. Credenciais de sessão do navegador não foram versionadas. O banco usado no celular não foi restaurado para executar estes testes.

## Limites e próximos testes

Não foi concluída execução Android/iOS nesta rodada: o emulador deixou de estar conectado. GPS, câmera/galeria, permissões, teclado, fonte ampliada, leitor de tela, mapa nativo com os quatro tipos e retorno do segundo plano precisam ser verificados em aparelho. A criação de ocorrência e participação em consulta foram cobertas por API/Postman, não por automação de todos esses passos na UI nativa. Histórico anterior teve autorização testada por integração; sua jornada visual após mudança de CEP ainda precisa de conferência.

Não houve medição de desempenho em release, execução de Docker, push ou deploy nesta consolidação. A exposição de anexos por URL pública foi preservada: antes de disponibilizar fotografias reais publicamente, definir autorização e retenção; UUID não é controle de acesso. A divisão das demais rotas do arquivo principal da API continua como manutenção futura; apenas o resumo territorial foi extraído.

O roteiro operacional e a restauração administrativa explícita estão em [15-roteiro-demonstracao.md](15-roteiro-demonstracao.md).

## Serviço local para o celular

A API na porta 3001 foi reiniciada com o código validado, conservando `fiscaliza_preview`, sem seed ou restauração. Health retornou 200 em loopback e em `192.168.1.38`; login da cidadã retornou 200. A configuração local do Expo permanece `http://192.168.1.38:3001/api`. Metro da outra sessão foi preservado.
