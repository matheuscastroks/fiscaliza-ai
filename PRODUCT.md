# Fiscaliza aí — Produto

## Posicionamento

Plataforma de inteligência urbana participativa que conecta cidadãos, território e gestão pública para identificar necessidades, construir propostas, acompanhar ações e avaliar resultados. Registrar ocorrências é uma modalidade de participação.

## Plataformas

adaptive — aplicativo Expo Android/iOS e painel municipal web separado. O navegador oferece acesso alternativo ao cidadão, com lista territorial no lugar do mapa nativo.

## Contexto de uso

Demonstração acadêmica de um produto possível, com municípios reais, conteúdo fictício, contas próprias e dados persistidos em PostgreSQL. O cenário inicial usa Rio de Janeiro/RJ. A experiência cotidiana usa linguagem de produto; o caráter acadêmico fica em Sobre e controles administrativos de apresentação. Sem vínculo institucional real.

## Públicos e responsabilidades

- Cidadão: identifica, complementa, apoia, propõe, responde consultas, acompanha e avalia.
- Gestão: analisa, encaminha, responde, publica decisões, executa e presta contas.
- Administrador: restaura cenários de apresentação com confirmação.

## Jornadas

1. Ocorrência: território → verificar semelhantes → registrar/complementar → resposta municipal → execução → avaliação ou revisão.
2. Proposta: necessidade → melhoria justificada → discussão/apoio → decisão fundamentada → ação relacionada.
3. Consulta: contexto e prazo → escolha individual alterável até encerramento → resultado e devolutiva.
4. Ação pública: responsável e previsão → atualizações/evidências → resultado.

## Princípios

- O retorno à contribuição é parte da participação.
- Nenhuma gravação parece concluída antes da confirmação do servidor.
- Prioridade técnica não é popularidade. Impacto informado pelo cidadão é distinto de prioridade.
- IA é assistência revisável; texto pode usar Gemini pelo servidor, com fallback heurístico. Fotos não são enviadas ao Google nesta versão.
- Território tem localização coerente, bairro e acesso por lista.
- Um dado tem uma fonte: API/banco. AsyncStorage serve a rascunhos, não a versões concorrentes do atendimento.
- Sem publicidade vazia, explicação incessante, pontos ou ranking competitivo.

## Navegação

No primeiro acesso, o cidadão consulta seu CEP e confirma município/UF. Novas ocorrências precisam estar dentro do polígono municipal. O perfil permite atualizar CEP ao mudar de residência, conservando histórico anterior. A gestão tem vínculo definido pela conta; não escolhe município no onboarding. CEP não comprova residência. Dados, permissões, cache e rascunhos respeitam esse contexto territorial.

Início, Território, Participar e Acompanhar. Perfil, bairros, resultados, ajuda, preferências e Sobre no menu secundário.

## Evidências

Auditoria inicial de código e testes registrada em plan/09-participacao-integrada.md. Evidência de execução desta entrega em plan/11-validacao-integrada.md; só considerar verificações efetivamente executadas. Screenshots web não comprovam funcionamento nativo.

## Limites

Sem GOV.BR, orçamento participativo, chat, push, estatística representativa de toda a população ou publicação automática. Leituras remotas exigem serviço disponível; o formulário conserva rascunhos locais em falhas. Dados pessoais e fotos de terceiros não são necessários à apresentação.

## Recorte territorial e retorno

Home, Território e Resultados compartilham a seleção de bairro, isolada por cidadão e município. Iniciativas podem abranger o município, um bairro ou um local explícito. As municipais continuam disponíveis no recorte local com sua abrangência identificada; somente pontos informados recebem marcadores. Indicadores municipais ficam separados dos bairros.

A Home destaca avaliações pendentes do autor, respostas, consultas próximas do encerramento e entregas recentes, quando existem. Respostas da gestão têm origem registrada; atualizações antigas sem origem recebem rótulo neutro. O histórico de municípios anteriores abre somente leitura para autoria ou participação persistida.
