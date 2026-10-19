import { useState, type FormEvent, type ReactNode } from 'react';
import { labels, date } from './domain';
import { upload } from './api';
import type { CityComment } from '../../shared/contracts';
export function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge status-${value}`}>{labels[value] || value}</span>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function AsyncForm({
  onSave,
  children,
  submit = 'Salvar',
  onDone,
}: {
  onSave: (form: HTMLFormElement) => Promise<void>;
  children: ReactNode;
  submit?: string;
  onDone?: () => void;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.querySelector('[data-uploading="true"]')) {
      setError('Aguarde o envio da imagem antes de salvar.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSave(form);
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={save}>
      <fieldset disabled={pending}>
        {children}
        <ErrorMessage error={error} />
        <button type="submit">{pending ? 'Salvando…' : submit}</button>
      </fieldset>
    </form>
  );
}
export function EvidenceInput({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  return (
    <div
      className="evidence-input"
      data-uploading={pending ? 'true' : undefined}
    >
      <label className="field">
        <span>Anexar evidência (JPEG, PNG ou WebP, até 5 MB)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending || urls.length >= 8}
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (!file) return;
            setPending(true);
            setError('');
            try {
              onChange([...urls, await upload(file)]);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setPending(false);
            }
          }}
        />
      </label>
      {pending && (
        <p role="status">Enviando imagem… Aguarde antes de salvar.</p>
      )}
      <ErrorMessage error={error} />
      {urls.length > 0 && (
        <ul>
          {urls.map((url, i) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer">
                Evidência {i + 1}
              </a>{' '}
              <button
                type="button"
                className="text-button"
                disabled={pending}
                onClick={() => onChange(urls.filter((u) => u !== url))}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function Images({ urls }: { urls: string[] }) {
  return urls.length ? (
    <div className="images">
      {urls.map((u, i) => (
        <a key={`${u}-${i}`} href={u} target="_blank" rel="noreferrer">
          <img src={u} loading="lazy" alt={`Imagem do registro ${i + 1}`} />
        </a>
      ))}
    </div>
  ) : (
    <p className="muted">Nenhuma imagem anexada.</p>
  );
}
export function Comments({
  comments,
  onReply,
}: {
  comments: CityComment[];
  onReply: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  return (
    <section className="section">
      <h3>Conversa com o cidadão</h3>
      {comments.length ? (
        <ol className="timeline comment-list">
          {comments.map((c) => (
            <li key={c.id}>
              <div className="comment-profile">
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt={`Foto de ${c.userName}`}
                    loading="lazy"
                  />
                ) : (
                  <span className="comment-avatar" aria-hidden="true">
                    {c.userName.slice(0, 1)}
                  </span>
                )}
                <div>
                  <strong>{c.userName}</strong>
                  <time dateTime={c.createdAt}>{date(c.createdAt)}</time>
                </div>
              </div>
              <p>{c.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">Ainda não há mensagens.</p>
      )}
      <AsyncForm
        submit="Publicar resposta"
        onSave={async () => {
          await onReply(text.trim());
          setText('');
        }}
      >
        <Field label="Resposta pública">
          <textarea
            required
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </Field>
      </AsyncForm>
    </section>
  );
}
