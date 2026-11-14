# Roteiro de demonstração

## Preparação

Requer Node 22.18+, PostgreSQL e as dependências dos três projetos (`npm install`, `npm install --prefix backend`, `npm install --prefix municipal`). Configure `DATABASE_URL` e `DEMO_PASSWORD` no terminal da API, conforme `backend/.env.example`. Execute:

```powershell
npm run migrate --prefix backend
npm run seed --prefix backend
npm start --prefix backend
```

Em terminais separados, execute `npm run municipal:dev` e `npm start`. Configure `.env` a partir de `.env.example`. No celular com Expo Go, `EXPO_PUBLIC_API_URL` deve apontar para `http://<IP-LAN-do-computador>:3001/api`; mantenha os dispositivos na mesma rede e permita a porta no firewall. `localhost` no celular aponta para o próprio celular. No emulador Android padrão, use `http://10.0.2.2:3001/api`. Após mudar a URL, reinicie Metro com `npx expo start --clear`. Para web, inclua a origem efetiva em `WEB_ORIGINS`.

As contas são `beatrizarante@gmail.com` (cidadã), `gestao@vilaesperanca.exemplo` (gestão) e `admin@vilaesperanca.exemplo` (admin). A senha vem de `DEMO_PASSWORD`; o padrão local sem configuração é `Fiscaliza123!`. O seed preserva senhas de contas existentes.

## Percurso cidadão–gestão

1. Entre como Ana, consulte o CEP **20010-000** e confirme **Rio de Janeiro/RJ**. Vila Esperança nos e-mails é apenas parte dos identificadores fictícios; não é o município escolhido.
2. Na Home, escolha Centro ou Todo o município. Abra Território e confira a seleção compartilhada. Explore ocorrências, propostas, consultas e ações. No navegador há lista; o mapa nativo só recebe registros com coordenadas explícitas.
3. Abra a ocorrência de iluminação da praça, acompanhe-a e complemente o relato. Para criar outra, use uma localização real dentro do Rio; teste a recusa de um ponto externo sem perder o rascunho.
4. Em outro navegador/sessão, entre no painel como gestão. Na fila, encaminhe a ocorrência para Em andamento, informe setor e justificativa. Conclua com uma resposta pública.
5. Volte ao cidadão e atualize/reabra a Home. Abra o atendimento concluído e confirme a solução ou solicite revisão com motivo. Não há push; buscar novamente é necessário.
6. Envie uma proposta para o bairro ou município. No painel, publique uma decisão justificada. Teste as abrangências municipal, bairro e local específico; coordenadas externas devem ser recusadas.
7. Responda à consulta aberta. Confira resposta individual, encerramento com devolutiva no painel e resultado no cidadão. Apoios e respostas não devem duplicar após reabrir a tela.
8. Compare Município e bairros, Resultados e Território. Iniciativas municipais aparecem separadas dos bairros; contagens descrevem somente a base da plataforma.
9. Para testar mudança de residência, atualize o CEP no perfil. Os acompanhamentos antigos abrem em detalhe somente leitura; novas interações pertencem à cidade atual.

## Restaurar e repetir

A restauração é uma ação administrativa explícita: entre como admin e use os controles de apresentação, escolhendo cenário e confirmando a restauração. Ela afeta os registros do cenário Rio e pode remover alterações feitas durante a demonstração. Não execute automaticamente nem use o banco de apresentação nas suites de integração. O seed comum não restaura registros modificados.

Use imagens sem dados pessoais. Os anexos continuam públicos por URL; UUID não substitui autorização. Consulte [o registro de validação](16-validacao-consolidacao.md) para distinguir verificações executadas e pendências em aparelho físico.
