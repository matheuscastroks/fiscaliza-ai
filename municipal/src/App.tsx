import { Appearance } from './Appearance';
import { NavIcon } from './NavIcon';
import { useCallback, useEffect, useState } from 'react';
import type {
  CityOverview,
  CivicItem,
  Occurrence,
  SessionUser,
} from '../../shared/contracts';
import { Civic } from './Civic';
import { Occurrences } from './Occurrences';
import { Territory } from './Territory';
import { allPages, api, ApiError } from './api';
import { hasMunicipalAccess } from './domain';
import { AsyncForm, ErrorMessage, Field } from './ui';
type Page =
  | 'queue'
  | 'proposal'
  | 'consultation'
  | 'action'
  | 'territory'
  | 'about'
  | 'presentation';
const pages: { id: Page; name: string }[] = [
  { id: 'queue', name: 'Fila' },
  { id: 'proposal', name: 'Propostas' },
  { id: 'consultation', name: 'Consultas' },
  { id: 'action', name: 'Ações' },
  { id: 'territory', name: 'Território' },
  { id: 'about', name: 'Sobre' },
];
export function App() {
  const [user, setUser] = useState<SessionUser | null>(null),
    [hydrating, setHydrating] = useState(true),
    [sessionError, setSessionError] = useState(''),
    [page, setPage] = useState<Page>('queue');
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]),
    [items, setItems] = useState<CivicItem[]>([]),
    [overview, setOverview] = useState<CityOverview | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [updatedAt, setUpdatedAt] = useState<Date | null>(null),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    api<SessionUser>('/auth/me')
      .then((u) => {
        if (active) setUser(u);
      })
      .catch((e) => {
        if (active && (!(e instanceof ApiError) || e.status !== 401))
          setSessionError(e.message);
      })
      .finally(() => {
        if (active) setHydrating(false);
      });
    const expired = () => {
      setUser(null);
      setLoaded(false);
      setOccurrences([]);
      setItems([]);
      setOverview(null);
    };
    window.addEventListener('session-expired', expired);
    return () => {
      active = false;
      window.removeEventListener('session-expired', expired);
    };
  }, []);
  const refresh = useCallback(async () => {
    if (!hasMunicipalAccess(user)) return;
    setLoading(true);
    setError('');
    try {
      const [os, cs, o] = await Promise.all([
        allPages<Occurrence>('/occurrences'),
        allPages<CivicItem>('/civic-items'),
        api<CityOverview>('/overview'),
      ]);
      setOccurrences(os);
      setItems(cs);
      setOverview(o);
      setUpdatedAt(new Date());
      setLoaded(true);
    } catch (e) {
      // Readback failure belongs to the page, never to an already persisted mutation.
      setError(
        `Não foi possível atualizar os registros. ${(e as Error).message} Use Atualizar para tentar novamente.`,
      );
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void refresh().catch(() => {});
    const focus = () => {
      void refresh().catch(() => {});
    };
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, [refresh]);
  async function logout() {
    await api('/auth/logout', 'POST');
    setUser(null);
    setLoaded(false);
    setOccurrences([]);
    setItems([]);
    setOverview(null);
    setPage('queue');
  }
  if (hydrating)
    return (
      <main className="session-screen">
        <p role="status">Verificando sessão…</p>
      </main>
    );
  if (!user)
    return (
      <Login
        error={sessionError}
        onLogin={(u) => {
          setSessionError('');
          setUser(u);
        }}
      />
    );
  if (user.role === 'citizen')
    return (
      <main className="session-screen">
        <div className="login-panel">
          <p className="brand">Fiscaliza aí</p>
          <h1>Acesso restrito à gestão</h1>
          <p role="alert">
            403 · Esta conta é de cidadão. Use o aplicativo para participar ou
            entre com uma conta da equipe municipal.
          </p>
          <AsyncForm onSave={logout} submit="Sair da conta">
            <></>
          </AsyncForm>
        </div>
      </main>
    );
  if (!hasMunicipalAccess(user))
    return (
      <main className="session-screen">
        <div className="login-panel">
          <p className="brand">Fiscaliza aí</p>
          <h1>Conta sem vínculo municipal</h1>
          <p role="alert">
            Esta conta de gestão não possui um município autorizado. Solicite a
            configuração do vínculo ao administrador para acessar os registros.
          </p>
          <AsyncForm onSave={logout} submit="Sair da conta">
            <></>
          </AsyncForm>
        </div>
      </main>
    );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#fila"
          onClick={(e) => {
            e.preventDefault();
            setPage('queue');
          }}
        >
          Fiscaliza<span> aí</span>
        </a>
        <p className="workspace-label">
          Gestão municipal
          <br />
          <strong>
            {user.municipality.name} · {user.municipality.state}
          </strong>
        </p>
        <nav aria-label="Navegação principal">
          {pages.map((p) => (
            <button
              key={p.id}
              aria-current={page === p.id ? 'page' : undefined}
              onClick={() => setPage(p.id)}
            >
              <NavIcon name={p.id} />
              {p.name}
            </button>
          ))}
        </nav>
        <Appearance />
        <div className="account">
          <strong>{user.name}</strong>
          <span>
            {user.role === 'admin' ? 'Administrador' : 'Equipe municipal'}
            {user.sector ? ` · ${user.sector}` : ''}
          </span>
          {user.role === 'admin' && (
            <button
              className="text-button"
              onClick={() => setPage('presentation')}
            >
              Controles de apresentação
            </button>
          )}
          <AsyncForm onSave={logout} submit="Sair">
            <></>
          </AsyncForm>
        </div>
      </aside>
      <div className="main-shell">
        <header className="toolbar">
          <span>Atendimento e participação urbana</span>
          <div>
            <span className="muted update-time">
              {updatedAt
                ? `Atualizado às ${updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </span>
            <button
              className="secondary"
              disabled={loading}
              onClick={() => void refresh().catch(() => {})}
            >
              {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <ErrorMessage error={error} />
          {!loaded && loading ? (
            <p role="status">Carregando registros municipais…</p>
          ) : !loaded && error ? (
            <p>Use “Atualizar” para tentar carregar novamente.</p>
          ) : (
            <>
              {page === 'queue' && (
                <Occurrences items={occurrences} onChange={refresh} />
              )}
              {(page === 'proposal' ||
                page === 'consultation' ||
                page === 'action') && (
                <Civic
                  key={page}
                  kind={page}
                  items={items}
                  onChange={refresh}
                />
              )}
              {page === 'territory' && <Territory overview={overview} />}
              {page === 'about' && <About />}
              {page === 'presentation' && user.role === 'admin' && (
                <Presentation onReset={refresh} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
function Login({
  onLogin,
  error,
}: {
  onLogin: (user: SessionUser) => void;
  error: string;
}) {
  return (
    <main className="session-screen">
      <div className="login-panel">
        <p className="brand">
          Fiscaliza<span>-AI</span>
        </p>
        <p className="muted">Gestão municipal</p>
        <h1>Entrar no atendimento</h1>
        <p>Acesse com sua conta da equipe municipal.</p>
        <ErrorMessage error={error} />
        <AsyncForm
          submit="Entrar"
          onSave={async (form) => {
            const data = new FormData(form);
            const result = await api<{ user: SessionUser }>(
              '/auth/login',
              'POST',
              {
                email: String(data.get('email')),
                password: String(data.get('password')),
              },
            );
            onLogin(result.user);
          }}
        >
          <Field label="E-mail">
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              maxLength={254}
            />
          </Field>
          <Field label="Senha">
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              maxLength={256}
            />
          </Field>
        </AsyncForm>
      </div>
    </main>
  );
}
function About() {
  return (
    <article className="form-page">
      <h1>Sobre o Fiscaliza aí</h1>
      <p>
        Projeto acadêmico de participação urbana: conecta o relato do cidadão, a
        análise municipal e a devolutiva pública.
      </p>
      <h2>Ambiente de apresentação</h2>
      <p>
        Os municípios são reais; as contas e os registros iniciais do cenário
        são fictícios, usados para demonstração e avaliação acadêmica. A
        plataforma não possui vínculo institucional com prefeituras nem com o
        GOV.BR.
      </p>
      <h2>Responsabilidade no atendimento</h2>
      <p>
        A gestão registra encaminhamentos com justificativa, responsável e
        histórico. O cidadão acompanha as respostas, consulta evidências e pode
        solicitar revisão da conclusão.
      </p>
      <p>
        Apoios não definem prioridade. A equipe municipal deve avaliar urgência,
        impacto territorial e condições de execução.
      </p>
    </article>
  );
}
function Presentation({ onReset }: { onReset: () => Promise<void> }) {
  const [confirmation, setConfirmation] = useState(''),
    [done, setDone] = useState('');
  return (
    <article className="form-page">
      <h1>Controles de apresentação</h1>
      <p>
        Área exclusiva de administradores. Restaurar o cenário substitui os
        registros, respostas e vínculos do ambiente.
      </p>
      <AsyncForm
        submit="Restaurar cenário"
        onSave={async (form) => {
          if (confirmation !== 'RESTAURAR')
            throw new Error(
              'Digite RESTAURAR para confirmar a substituição dos dados.',
            );
          await api('/presentation/reset', 'POST', {
            scenario: String(new FormData(form).get('scenario')),
          });
          setConfirmation('');
          setDone('Cenário restaurado. Confira os registros na fila.');
          await onReset();
        }}
      >
        <Field label="Cenário">
          <select name="scenario">
            <option value="registered">Registros recebidos</option>
            <option value="in_progress">Atendimentos em andamento</option>
            <option value="resolved">Atendimentos concluídos</option>
          </select>
        </Field>
        <Field label="Confirme digitando RESTAURAR">
          <input
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
          />
        </Field>
      </AsyncForm>
      {done && (
        <p className="notice" role="status">
          {done}
        </p>
      )}
    </article>
  );
}
