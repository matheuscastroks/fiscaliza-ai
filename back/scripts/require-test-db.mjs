// Os testes apagam e recriam dados. Recusa rodar contra um banco que não seja de teste.
const url = process.env.DATABASE_URL;
// No CI, sem banco os testes com PostgreSQL seriam pulados em silêncio e o
// resultado sairia verde sem testar nada.
if (!url && process.env.CI) {
  console.error('Recusado: no CI, defina DATABASE_URL com um banco de teste.');
  process.exit(1);
}
if (url) {
  let name = '';
  try {
    name = new URL(url).pathname.replace(/^\//, '');
  } catch {
    // URL inválida: tratada como não segura abaixo.
  }
  if (!name.endsWith('_test')) {
    console.error(
      `Recusado: os testes só rodam em banco cujo nome termine em "_test" (recebi "${name || 'inválido'}").\n` +
        'Aponte DATABASE_URL para um banco de teste (ex.: .../fiscaliza_test) ou remova a variável para pular os testes com banco.',
    );
    process.exit(1);
  }
}
