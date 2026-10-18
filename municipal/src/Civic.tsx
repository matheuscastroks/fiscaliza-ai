import { useState } from 'react';
import type { CivicItem, PublicAction } from '../../shared/contracts';
import { api } from './api';
import {
  civicTerritoryDraft, civicTerritoryLabel, serializeCivicTerritory,
  date, isoDate, labels, type CivicTerritoryDraft,
} from './domain';
import { AsyncForm, Badge, Comments, EvidenceInput, Field, Images } from './ui';
type Kind = CivicItem['kind'];
const headings: Record<Kind, string> = {
  proposal: 'Propostas da comunidade',
  consultation: 'Consultas públicas',
  action: 'Ações no território',
};
export function Civic({
  kind,
  items,
  onChange,
}: {
  kind: Kind;
  items: CivicItem[];
  onChange: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false),
    [source, setSource] = useState<CivicItem | undefined>();
  const filtered = items.filter((i) => i.kind === kind),
    active = items.find((i) => i.id === selected);
  if (creating)
    return (
      <CivicCreate
        actualKind={
          kind === 'consultation' && !source ? 'consultation' : 'action'
        }
        source={source}
        onBack={() => {
          setCreating(false);
          setSource(undefined);
        }}
        onSave={async () => {
          setCreating(false);
          setSource(undefined);
          setSelected(null);
          await onChange();
        }}
      />
    );
  if (active)
    return (
      <CivicDetail
        key={active.id}
        item={active}
        allItems={items}
        onBack={() => setSelected(null)}
        onChange={onChange}
        onAction={() => {
          setSource(active);
          setCreating(true);
        }}
      />
    );
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{headings[kind]}</h1>
          <p>
            {kind === 'proposal'
              ? 'Analise as ideias e publique uma decisão fundamentada.'
              : kind === 'consultation'
                ? 'Ouça a comunidade e devolva os resultados.'
                : 'Registre a execução, os prazos e as evidências.'}
          </p>
        </div>
        {kind !== 'proposal' && (
          <button onClick={() => setCreating(true)}>
            {kind === 'consultation' ? 'Criar consulta' : 'Criar ação'}
          </button>
        )}
      </header>
      {filtered.length ? (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">{headings[kind]}</caption>
            <thead>
              <tr>
                <th scope="col">
                  {kind === 'consultation' ? 'Pergunta' : 'Registro'}
                </th>
                <th scope="col">Abrangência</th>
                <th scope="col">Situação</th>
                <th scope="col">
                  {kind === 'action'
                    ? 'Progresso'
                    : kind === 'consultation'
                      ? 'Respostas'
                      : 'Apoios'}
                </th>
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
                    <small>{i.summary}</small>
                  </td>
                  <td>{civicTerritoryLabel(i)}</td>
                  <td>
                    <Badge value={i.status} />
                  </td>
                  <td>
                    {i.kind === 'action'
                      ? `${i.progress}%`
                      : i.kind === 'consultation'
                        ? i.answerCounts.reduce((a, b) => a + b, 0)
                        : i.supports}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Nenhum registro disponível nesta seção.</p>
      )}
    </>
  );
}
function CivicCreate({
  actualKind,
  source,
  onBack,
  onSave,
}: {
  actualKind: 'action' | 'consultation';
  source?: CivicItem;
  onBack: () => void;
  onSave: () => Promise<void>;
}) {
  const [territory, setTerritory] = useState(() => civicTerritoryDraft(source));
  return (
    <>
      <button className="text-button back" onClick={onBack}>
        ← Voltar
      </button>
      <h1>
        {actualKind === 'action'
          ? 'Criar ação municipal'
          : 'Criar consulta pública'}
      </h1>
      {source && (
        <p>
          Ação vinculada à proposta: <strong>{source.title}</strong>
        </p>
      )}
      <div className="form-page">
        <AsyncForm
          submit={actualKind === 'action' ? 'Publicar ação' : 'Abrir consulta'}
          onSave={async (form) => {
            const data = new FormData(form);
            const value = (key: string) => String(data.get(key) || '').trim();
            const payload: Record<string, unknown> = {
              kind: actualKind,
              title: value('title'),
              summary: value('summary'),
              body: value('body'),
              ...serializeCivicTerritory(territory),
              responsible: value('responsible'),
              linkedIds: source
                ? [source.id]
                : value('linkedIds')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            };
            if (actualKind === 'consultation') {
              const options = value('options')
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
              if (
                options.length < 2 ||
                options.length > 10 ||
                new Set(options).size !== options.length
              )
                throw new Error(
                  'Informe de 2 a 10 opções diferentes, uma por linha.',
                );
              const closesAt = isoDate(value('deadline'));
              if (!closesAt || Date.parse(closesAt) <= Date.now())
                throw new Error('O prazo deve estar no futuro.');
              payload.options = options;
              payload.closesAt = closesAt;
            } else payload.dueAt = isoDate(value('deadline'));
            await api('/civic-items', 'POST', payload);
            await onSave();
          }}
        >
          <Field
            label={
              actualKind === 'consultation'
                ? 'Pergunta da consulta'
                : 'Título da ação'
            }
          >
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={source?.title}
            />
          </Field>
          <Field label="Resumo">
            <textarea
              name="summary"
              required
              maxLength={500}
              rows={2}
              defaultValue={source?.summary}
            />
          </Field>
          <Field label="Contexto e descrição">
            <textarea
              name="body"
              required
              maxLength={5000}
              rows={5}
              defaultValue={source?.body}
            />
          </Field>
          <TerritoryFields value={territory} onChange={setTerritory} />
          <Field label="Setor ou equipe responsável">
            <input name="responsible" required maxLength={120} />
          </Field>
          <Field
            label={
              actualKind === 'consultation'
                ? 'Receber respostas até'
                : 'Prazo previsto'
            }
          >
            <input name="deadline" required type="datetime-local" />
          </Field>
          {actualKind === 'consultation' && (
            <Field label="Opções de resposta (uma por linha)">
              <textarea required name="options" rows={5} />
            </Field>
          )}
          {!source && (
            <Field label="Protocolos relacionados (separados por vírgula, opcional)">
              <input name="linkedIds" />
            </Field>
          )}
        </AsyncForm>
      </div>
    </>
  );
}
function CivicDetail({
  item,
  allItems,
  onBack,
  onChange,
  onAction,
}: {
  item: CivicItem;
  allItems: CivicItem[];
  onBack: () => void;
  onChange: () => Promise<void>;
  onAction: () => void;
}) {
  const [status, setStatus] = useState(item.status),
    [territory, setTerritory] = useState(() => civicTerritoryDraft(item)),
    [decision, setDecision] = useState(
      item.kind === 'proposal'
        ? item.decision || ''
        : item.kind === 'consultation'
          ? item.result || ''
          : '',
    ),
    [progress, setProgress] = useState(
      item.kind === 'action' ? item.progress : 0,
    ),
    [responsible, setResponsible] = useState(item.responsible),
    [update, setUpdate] = useState(''),
    [evidence, setEvidence] = useState<string[]>([]);
  const statuses: string[] =
    item.kind === 'proposal'
      ? item.status === 'submitted'
        ? ['submitted', 'under_review', 'accepted', 'declined']
        : item.status === 'under_review'
          ? ['under_review', 'accepted', 'declined']
          : [item.status]
      : item.kind === 'consultation'
        ? item.status === 'open'
          ? ['open', 'closed']
          : ['closed']
        : item.status === 'planned'
          ? ['planned', 'in_progress']
          : item.status === 'in_progress'
            ? ['in_progress', 'completed']
            : ['completed'];
  const effectiveStatus = statuses.includes(status) ? status : item.status;
  const related = allItems.filter(
    (i) => item.linkedIds.includes(i.id) || i.linkedIds.includes(item.id),
  );
  return (
    <>
      <button className="text-button back" onClick={onBack}>
        ← Voltar à lista
      </button>
      <header className="page-heading">
        <div>
          <h1>{item.title}</h1>
          <p>
            {civicTerritoryLabel(item)} · {item.responsible}
          </p>
        </div>
        <Badge value={item.status} />
      </header>
      <div className="detail-grid">
        <article>
          <section className="section">
            <h2>{item.summary}</h2>
            <p className="preserve">{item.body}</p>
            {item.kind === 'proposal' && <Images urls={item.images || []} />}
            {item.territory?.scope === 'location' && (
              <p className="muted">
                {item.territory.location.address && <>{item.territory.location.address} · </>}
                Latitude {item.territory.location.latitude}, longitude {item.territory.location.longitude}
              </p>
            )}
            <p className="muted">
              Publicado em {date(item.createdAt)} · {item.supports} apoios
            </p>
            {item.kind === 'proposal' && item.decision && (
              <div className="notice">
                <h3>Decisão municipal</h3>
                <p>{item.decision}</p>
              </div>
            )}
            {item.kind === 'consultation' && (
              <>
                <p>
                  Prazo: {date(item.closesAt)} ·{' '}
                  {item.answerCounts.reduce((a, b) => a + b, 0)} respostas
                </p>
                <h3>Respostas da comunidade</h3>
                <ul className="result-list">
                  {item.options.map((option, index) => (
                    <li key={option}>
                      <span>{option}</span>
                      <strong>{item.answerCounts[index] || 0}</strong>
                    </li>
                  ))}
                </ul>
                {item.result && (
                  <div className="notice">
                    <h3>Resultado publicado</h3>
                    <p>{item.result}</p>
                  </div>
                )}
              </>
            )}
            {item.kind === 'action' && (
              <>
                <label className="progress-label">
                  Execução: {item.progress}%
                  <progress value={item.progress} max={100} />
                </label>
                <p>Prazo previsto: {date(item.dueAt)}</p>
                <h3>Evidências da execução</h3>
                <Images urls={item.evidence} />
                <h3>Atualizações</h3>
                {item.updates.length ? (
                  <ol className="timeline">
                    {item.updates.map((u, i) => (
                      <li key={`${u.at}-${i}`}>
                        <time>{date(u.at)}</time>
                        <p>{u.text}</p>
                        <small>{u.actor}</small>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted">Nenhuma atualização publicada.</p>
                )}
              </>
            )}
          </section>
          {item.history && item.history.length > 0 && (
            <section className="section">
              <h2>Histórico de decisões</h2>
              <ol className="timeline">
                {item.history.map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    <strong>
                      {labels[event.from]} → {labels[event.to]}
                    </strong>
                    <time dateTime={event.at}>{date(event.at)}</time>
                    <p>{event.text}</p>
                    <small>{event.actor}</small>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section className="section">
            <h2>Registros relacionados</h2>
            {related.length ? (
              <ul>
                {related.map((r) => (
                  <li key={r.id}>
                    {r.title} — {labels[r.status]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {item.linkedIds.length
                  ? item.linkedIds.join(', ')
                  : 'Nenhum vínculo registrado.'}
              </p>
            )}
          </section>
          <Comments
            comments={item.comments}
            onReply={async (text) => {
              await api(`/civic-items/${item.id}/comments`, 'POST', { text });
              await onChange();
            }}
          />
        </article>
        <aside className="workflow">
          <h2>
            {item.kind === 'proposal'
              ? 'Analisar proposta'
              : item.kind === 'consultation'
                ? 'Publicar devolutiva'
                : 'Atualizar execução'}
          </h2>
          <AsyncForm
            submit="Publicar atualização"
            onSave={async (form) => {
              const payload: Record<string, unknown> = {
                status: effectiveStatus,
                responsible: responsible.trim(),
                territory: serializeCivicTerritory(territory).territory,
              };
              if (item.kind === 'proposal') {
                if (!decision.trim())
                  throw new Error('Justifique a análise ou a decisão.');
                payload.decision = decision.trim();
              }
              if (item.kind === 'consultation') {
                if (effectiveStatus === 'closed' && !decision.trim())
                  throw new Error('Informe o resultado antes de encerrar.');
                if (decision.trim()) payload.result = decision.trim();
              }
              if (item.kind === 'action') {
                if (!update.trim())
                  throw new Error(
                    'Descreva o avanço ou a mudança para a comunidade.',
                  );
                payload.progress = Number(progress);
                payload.update = update.trim();
                payload.evidence = evidence;
                payload.dueAt = isoDate(
                  String(new FormData(form).get('dueAt')),
                );
              }
              await api(`/civic-items/${item.id}`, 'PATCH', payload);
              setEvidence([]);
              setUpdate('');
              await onChange();
            }}
          >
            <Field label="Situação">
              <select
                value={effectiveStatus}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                {!statuses.includes(item.status) && (
                  <option value={item.status}>{labels[item.status]}</option>
                )}
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsável">
              <input
                required
                maxLength={120}
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </Field>
            <TerritoryFields value={territory} onChange={setTerritory} />
            {item.kind !== 'action' ? (
              <Field
                label={
                  item.kind === 'proposal'
                    ? 'Justificativa da decisão'
                    : 'Resultado e próximos passos'
                }
              >
                <textarea
                  required={
                    item.kind === 'proposal' || effectiveStatus === 'closed'
                  }
                  maxLength={3000}
                  rows={6}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                />
              </Field>
            ) : (
              <>
                <Field label="Progresso (%)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                  />
                </Field>
                <Field label="Prazo previsto">
                  <input
                    name="dueAt"
                    required
                    type="datetime-local"
                    defaultValue={localDate(item.dueAt)}
                  />
                </Field>
                <Field label="Atualização pública">
                  <textarea
                    required
                    maxLength={3000}
                    rows={5}
                    value={update}
                    onChange={(e) => setUpdate(e.target.value)}
                  />
                </Field>
                <EvidenceInput urls={evidence} onChange={setEvidence} />
              </>
            )}
          </AsyncForm>
          {item.kind === 'proposal' && item.status === 'accepted' && (
            <div className="section">
              <h3>Encaminhar para execução</h3>
              <p>
                Crie uma ação com prazo e equipe responsável, vinculada a esta
                proposta.
              </p>
              <button className="secondary" onClick={onAction}>
                Criar ação vinculada
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
function TerritoryFields({ value, onChange }: {
  value: CivicTerritoryDraft;
  onChange: (value: CivicTerritoryDraft) => void;
}) {
  const change = (key: keyof CivicTerritoryDraft, next: string) =>
    onChange({ ...value, [key]: next });
  return (
    <>
      <Field label="Abrangência">
        <select value={value.scope} onChange={(e) => change('scope', e.target.value)}>
          <option value="municipality">Todo o município</option>
          <option value="neighborhood">Bairro</option>
          <option value="location">Local específico</option>
        </select>
      </Field>
      {value.scope !== 'municipality' && (
        <Field label="Bairro da abrangência">
          <input required maxLength={120} value={value.neighborhood}
            onChange={(e) => change('neighborhood', e.target.value)} />
        </Field>
      )}
      {value.scope === 'location' && (
        <>
          <p className="muted">Informe as coordenadas reais do local. O serviço valida se pertencem ao município da sessão.</p>
          <div className="form-columns">
            <Field label="Latitude">
              <input required type="number" min={-90} max={90} step="any" value={value.latitude}
                onChange={(e) => change('latitude', e.target.value)} />
            </Field>
            <Field label="Longitude">
              <input required type="number" min={-180} max={180} step="any" value={value.longitude}
                onChange={(e) => change('longitude', e.target.value)} />
            </Field>
          </div>
          <Field label="Endereço ou referência (opcional)">
            <input maxLength={300} value={value.address}
              onChange={(e) => change('address', e.target.value)} />
          </Field>
        </>
      )}
    </>
  );
}
function localDate(value: PublicAction['dueAt']) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
