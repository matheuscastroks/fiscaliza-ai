import type { CityOverview } from '../../shared/contracts';
export function Territory({ overview }: { overview: CityOverview | null }) {
  if (!overview) return <p role="status">Carregando território…</p>;
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Território</h1>
          <p>Distribuição dos relatos, propostas, consultas e ações por bairro.</p>
        </div>
      </header>
      <p className="overview-summary">
        <strong>{overview.occurrences}</strong> relatos recebidos,{' '}
        <strong>{overview.resolved}</strong> concluídos e{' '}
        <strong>{overview.actions}</strong> ações municipais. Há{' '}
        {overview.proposals} propostas e {overview.consultations} consultas
        registradas.
      </p>
      {overview.municipalScope && (
        <p>
          Abrangência de todo o município: {overview.municipalScope.proposals}{' '}
          propostas, {overview.municipalScope.consultations} consultas e{' '}
          {overview.municipalScope.actions} ações. Esses registros fazem parte
          dos totais acima e não são atribuídos a um bairro específico.
        </p>
      )}
      {overview.neighborhoods.length ? (
        <div className="table-scroll">
          <table>
            <caption>Registros com bairro informado</caption>
            <thead>
              <tr>
                <th scope="col">Bairro</th>
                <th scope="col">Relatos</th>
                <th scope="col">Concluídos</th>
                <th scope="col">Em atendimento ou recebidos</th>
                <th scope="col">Propostas</th>
                <th scope="col">Consultas</th>
                <th scope="col">Ações municipais</th>
              </tr>
            </thead>
            <tbody>
              {overview.neighborhoods.map((n) => (
                <tr key={n.name}>
                  <th scope="row">{n.name}</th>
                  <td>{n.occurrences}</td>
                  <td>{n.resolved}</td>
                  <td>{n.occurrences - n.resolved}</td>
                  <td>{n.proposals ?? 0}</td>
                  <td>{n.consultations ?? 0}</td>
                  <td>{n.actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">
          Ainda não há registros para distribuir por bairro.
        </p>
      )}
      <p className="muted">
        Apoios expressam interesse da comunidade e não determinam a prioridade
        de atendimento.
      </p>
    </>
  );
}
