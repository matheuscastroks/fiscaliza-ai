# Onboarding ilustrado

Implementado em 19/10/2026 sobre o fluxo de login e município existente.

## Comportamento

- Quatro etapas: conhecer o território, registrar uma necessidade, propor/participar e acompanhar/avaliar.
- Primeiro acesso em tela cheia, com Pular, deslize entre páginas, Próximo e Começar. A apresentação usa recursos locais e não aguarda resposta de autenticação.
- Conclusão salva por aparelho/navegador em fiscaliza-ai:onboarding:v1; logout e troca de município não a redefinem. Falhas de armazenamento não impedem continuar na sessão atual.
- Como funciona no menu móvel e na navegação desktop; reapresentação preserva a sessão e volta à tela anterior.
- SVGs originais do ZIP local, total de 49.225 bytes, conferidos por SHA-256 e sem scripts ou recursos remotos. Procedência registrada junto aos arquivos.
- Ilustrações também em Acompanhar e Participar sem conteúdo; não usadas para disfarçar falhas de carregamento.

## Evidência

Seis testes novos verificam primeiro acesso, persistência em nova instância, inicialização concorrente, leitura atrasada e falhas de leitura/gravação. npm test executa 42 testes locais.

Chrome com 390x844, 320x568 e 1440x1000: quatro páginas, SVG renderizado, navegação com movimento reduzido, conclusão, salto, recarga, reabertura mobile/desktop, conservação da sessão e estados vazios. API bloqueada: apresentação funciona. Autenticação deliberadamente pendente: apresentação aparece antes de a requisição concluir. Nenhum erro de JavaScript ou transbordamento horizontal nos cenários verificados. Scripts e capturas ficam em .validation/onboarding-* e não são versionados.

A evidência de interface é web; não substitui inspeção de gestos, safe areas e SVG no Expo Go em aparelho.
