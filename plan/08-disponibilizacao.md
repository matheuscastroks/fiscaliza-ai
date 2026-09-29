# Disponibilização sem backend

## Escopo
Aplicativo do cidadão e painel web da prefeitura com dados simulados. A proposta anterior de backend compartilhado foi descartada. Não contratar Supabase, Firebase, banco remoto, armazenamento remoto de fotos ou autenticação.

## Ferramentas propostas
| Parte | Proposta | Função |
| --- | --- | --- |
| App | Expo/React Native existente | Interface Android/iOS |
| Build | Expo EAS ou ambiente local adequado | Versão instalável |
| Painel | React + Vite | Interface web separada |
| Publicação web | Hospedagem estática, como Cloudflare Pages | Acesso por URL |
| Dados | Fixtures TypeScript/JSON e serviços mockados | Relatos e cenários fictícios |
| Persistência | AsyncStorage e armazenamento local do navegador | Estado local independente |

Stack e hospedagem web são propostas. O painel também pode ser apresentado localmente. Hospedagem estática serve arquivos e não é backend de aplicação.

## O que falta decidir
1. Cenários preparados e coerentes (recomendado) ou transferência manual dos dados digitados ao vivo.
2. Dispositivos e formato de apresentação do aplicativo.
3. Stack final do painel e necessidade de URL publicada.
4. Mapas online ou representação local apropriada.

Não há necessidade de orçamento de backend, chaves de banco ou acesso institucional ao gov.br. Distribuição móvel continua sujeita às condições da plataforma escolhida.

Referências consultadas anteriormente, a conferir quando distribuir: [Expo EAS](https://expo.dev/pricing), [distribuição interna](https://docs.expo.dev/build/internal-distribution/), [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/) e [Apple Developer](https://developer.apple.com/programs/).

Nenhuma conta foi criada, serviço contratado ou aplicação publicada.
