import { useState } from 'react';
import type { Occurrence, Status } from '../../shared/contracts';
import { api } from './api';
import {
  date,
  filterOccurrences,
  labels,
  nextStatuses,
  transitionError,
} from './domain';
import { AsyncForm, Badge, Comments, EvidenceInput, Field, Images } from './ui';

export function Occurrences({
  items,
  onChange,
}: {
  items: Occurrence[];
  onChange: () => Promise<void>;
}) {
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState(''),
    [category, setCategory] = useState(''),
    [neighborhood, setNeighborhood] = useState(''),
    [selected, setSelected] = useState<string | null>(null);
  const active = items.find((i) => i.id === selected);
  const filtered = filterOccurrences(
    items,
    query,
    status,
    category,
    neighborhood,
  );
  if (active)
    return (
      <OccurrenceDetail
        key={active.id}
        item={active}
        onBack={() => setSelected(null)}
        onChange={onChange}
      />
    );
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Fila de atendimento</h1>
          <p>Encaminhe relatos e mantenha o cidadão informado.</p>
        </div>
        <span className="count">
          {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
        </span>
      </header>
      <div className="filters">
        <Field label="Buscar relato ou endereço">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Título, endereço ou protocolo"
          />
        </Field>
        <Field label="Situação">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            {Object.keys(nextStatuses).map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoria">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {['road', 'lighting', 'cleaning', 'others'].map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bairro">
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          >
            <option value="">Todos</option>
            {[
              ...new Set(
                items.map((i) => i.location.neighborhood).filter(Boolean),
              ),
            ]
              .sort()
              .map((n) => (
                <option key={n}>{n}</option>
              ))}
          </select>
        </Field>
      </div>
      {filtered.length ? (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Relatos recebidos pela gestão</caption>
            <thead>
              <tr>
                <th scope="col">Relato</th>
                <th scope="col">Território</th>
                <th scope="col">Situação</th>
                <th scope="col">Recebimento</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}>
                  <td>
                    <button
                      className="row-link"
                      onClick={() => setSelected(i.id)}
                    >
                      {i.title}
                    </button>
                    <small>
                      {labels[i.category]} · Prioridade{' '}
                      {labels[i.priority].toLowerCase()}
                    </small>
                  </td>
                  <td>
                    {i.location.neighborhood || 'Sem bairro'}
                    <small>{i.location.address}</small>
                  </td>
                  <td>
                    <Badge value={i.status} />
                    {i.evaluation && !i.evaluation.satisfied && (
                      <small className="attention">Revisão solicitada</small>
                    )}
                  </td>
                  <td>{date(i.reportedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">
          Nenhum relato corresponde aos filtros. Ajuste a busca ou atualize a
          fila.
        </p>
      )}
    </>
  );
}

function OccurrenceDetail({
  item,
  onBack,
  onChange,
}: {
  item: Occurrence;
  onBack: () => void;
  onChange: () => Promise<void>;
}) {
  const [target, setTarget] = useState<Status>(item.status),
    [justification, setJustification] = useState(''),
    [sector, setSector] = useState(item.sector || ''),
    [images, setImages] = useState<string[]>([]),
    [priority, setPriority] = useState<Occurrence['priority']>(item.priority);
  const availableStatuses = [item.status, ...nextStatuses[item.status]];
  const effectiveTarget = availableStatuses.includes(target)
    ? target
    : item.status;
  return (
    <>
      <button className="text-button back" onClick={onBack}>
        ← Voltar à fila
      </button>
      <header className="page-heading">
        <div>
          <p className="protocol">Protocolo {item.id}</p>
          <h1>{item.title}</h1>
          <p>
            {item.location.neighborhood || 'Sem bairro'} ·{' '}
            {item.location.address}
          </p>
        </div>
        <Badge value={item.status} />
      </header>
      <div className="detail-grid">
        <article>
          <section className="section">
            <h2>Relato do cidadão</h2>
            <p className="preserve">{item.description}</p>
            <dl className="facts">
              <div>
                <dt>Recebido em</dt>
                <dd>{date(item.reportedAt)}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>{labels[item.category]}</dd>
              </div>
              <div>
                <dt>Setor</dt>
                <dd>{item.sector || 'A definir'}</dd>
              </div>
              {item.reportedImpact && (
                <div>
                  <dt>Risco informado pelo cidadão</dt>
                  <dd>{labels[item.reportedImpact]}</dd>
                </div>
              )}
              <div>
                <dt>Apoios</dt>
                <dd>{item.votes}</dd>
              </div>
              <div>
                <dt>Localização</dt>
                <dd>
                  {item.location.latitude.toFixed(5)},{' '}
                  {item.location.longitude.toFixed(5)}
                </dd>
              </div>
            </dl>
            <Images urls={item.images} />
          </section>
          {item.evaluation && (
            <section
              className={`section evaluation ${item.evaluation.satisfied ? '' : 'review'}`}
            >
              <h2>
                {item.evaluation.satisfied
                  ? 'Avaliação do cidadão'
                  : 'Pedido de revisão'}
              </h2>
              <p>
                {item.evaluation.satisfied
                  ? 'O cidadão informou que a solução foi satisfatória.'
                  : item.evaluation.reason}
              </p>
              <time>{date(item.evaluation.at)}</time>
              {!item.evaluation.satisfied && (
                <p>
                  Analise o relato e reabra o atendimento para registrar a
                  revisão.
                </p>
              )}
            </section>
          )}
          <section className="section">
            <h2>Histórico do atendimento</h2>
            <ol className="timeline">
              {item.statusHistory.map((event, index) => (
                <li key={event.id || index}>
                  <Badge value={event.status} />
                  <time dateTime={event.at}>{date(event.at)}</time>
                  <p>{event.justification}</p>
                  <small>
                    {event.actor || 'Gestão municipal'}
                    {event.sector ? ` · ${event.sector}` : ''}
                  </small>
                </li>
              ))}
            </ol>
          </section>
          <Comments
            comments={item.comments}
            onReply={async (text) => {
              await api(`/occurrences/${item.id}/comments`, 'POST', { text });
              await onChange();
            }}
          />
        </article>
        <aside className="workflow">
          <h2>
            {item.status === 'resolved'
              ? 'Reabrir atendimento'
              : 'Atualizar atendimento'}
          </h2>
          <AsyncForm
            submit="Registrar encaminhamento"
            onSave={async () => {
              const assignmentChanged =
                priority !== item.priority ||
                sector.trim() !== (item.sector || '');
              const error = transitionError(
                item.status,
                effectiveTarget,
                justification,
                sector,
                assignmentChanged,
              );
              if (error) throw new Error(error);
              await api(`/occurrences/${item.id}/transitions`, 'POST', {
                status: effectiveTarget,
                justification: justification.trim(),
                sector: sector.trim(),
                priority,
                images,
              });
              setJustification('');
              setImages([]);
              await onChange();
            }}
          >
            <Field label="Situação do atendimento">
              <select
                required
                value={effectiveTarget}
                onChange={(e) => setTarget(e.target.value as Status)}
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Setor responsável">
              <input
                required
                maxLength={120}
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </Field>
            <Field label="Prioridade técnica">
              <select
                required
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Occurrence['priority'])
                }
              >
                {(['low', 'medium', 'high'] as const).map((value) => (
                  <option key={value} value={value}>
                    {labels[value]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Justificativa pública">
              <textarea
                required
                maxLength={2000}
                rows={5}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Descreva o encaminhamento e o próximo passo."
              />
            </Field>
            <EvidenceInput urls={images} onChange={setImages} />
            <p className="muted">
              A justificativa e as evidências ficam disponíveis ao cidadão.
            </p>
          </AsyncForm>
        </aside>
      </div>
    </>
  );
}
