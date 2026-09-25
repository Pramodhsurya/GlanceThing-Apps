import { useCallback, useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { useSocketMessage } from './shared.tsx'

import styles from './GitHubApp.module.css'

interface Repo {
  fullName: string
  name: string
  owner: string
  description: string | null
  private: boolean
  stars: number
  forks: number
  openIssues: number
  language: string | null
  updatedAt: string
}

interface Item {
  number: number
  title: string
  author: string
  state: string
  draft: boolean
  merged: boolean
  comments: number
  updatedAt: string
  labels: { name: string; color: string }[]
}

interface Overview {
  user: {
    login: string
    name: string | null
    followers: number
    publicRepos: number
  }
  repos: Repo[]
  starred: Repo[]
  fetchedAt: number
}

interface RepoDetail {
  fullName: string
  state: 'open' | 'closed'
  pulls: Item[]
  issues: Item[]
}

type ListTab = 'repos' | 'starred'
type DetailTab = 'pulls' | 'issues'

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051'
}

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function compact(n: number) {
  return n >= 1000
    ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
    : String(n)
}

const ERRORS: Record<string, string> = {
  no_token:
    'Add a GitHub token in the GlanceThing desktop app (Settings → GitHub token), or sign in with the GitHub CLI (gh auth login).',
  bad_token:
    'GitHub rejected the saved token. Add a new one in the desktop app settings.'
}

const GitHubApp: React.FC = () => {
  const { closeApp } = useApps()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ListTab>('repos')
  const [repo, setRepo] = useState<Repo | null>(null)
  const [detail, setDetail] = useState<RepoDetail | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('pulls')
  const [state, setState] = useState<'open' | 'closed'>('open')
  const [detailError, setDetailError] = useState<string | null>(null)

  const { ready, socket } = useSocketMessage<unknown>(
    'github',
    (data, action) => {
      if (action === 'overview') {
        setOverview(data as Overview)
        setError(null)
        setLoading(false)
      } else if (action === 'repo') {
        setDetail(data as RepoDetail)
        setDetailError(null)
      } else if (action === 'error') {
        const { scope, error } = data as { scope: string; error: string }
        if (scope === 'repo') setDetailError(error)
        else {
          setError(error)
          setLoading(false)
        }
      }
    }
  )

  const send = useCallback(
    (action: string, data?: unknown) =>
      socket?.send(JSON.stringify({ type: 'github', action, data })),
    [socket]
  )

  useEffect(() => {
    if (!ready) return
    send('overview')
  }, [ready, send])

  useEffect(() => {
    if (!repo) return
    setDetail(null)
    setDetailError(null)
    send('repo', { fullName: repo.fullName, state })
  }, [repo, state, send])

  function refresh() {
    setLoading(true)
    if (repo) {
      setDetail(null)
      send('repo', { fullName: repo.fullName, state })
    }
    send('overview', { refresh: true })
  }

  const repos = overview
    ? tab === 'repos'
      ? overview.repos
      : overview.starred
    : []
  const items = detail
    ? detailTab === 'pulls'
      ? detail.pulls
      : detail.issues
    : []

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => (repo ? setRepo(null) : closeApp())}
        >
          <span className="material-icons">
            {repo ? 'arrow_back' : 'keyboard_arrow_down'}
          </span>
        </button>
        {repo ? (
          <div className={styles.titleBlock}>
            <div className={styles.title}>{repo.name}</div>
            <small>{repo.owner}</small>
          </div>
        ) : (
          <div className={styles.titleBlock}>
            <div className={styles.title}>GitHub</div>
            {overview ? <small>@{overview.user.login}</small> : null}
          </div>
        )}
        {overview && !repo ? (
          <div className={styles.avatar}>
            {(overview.user.name ?? overview.user.login)
              .slice(0, 1)
              .toUpperCase()}
          </div>
        ) : null}
        <button
          type="button"
          className={styles.iconBtn}
          data-spinning={loading && !error}
          onClick={refresh}
        >
          <span className="material-icons">refresh</span>
        </button>
      </div>

      {error ? (
        <div className={styles.message}>
          <span className="material-icons">vpn_key</span>
          <p>{ERRORS[error] ?? error}</p>
        </div>
      ) : !overview ? (
        <div className={styles.message}>
          <span className="material-icons">hourglass_empty</span>
          <p>Loading GitHub…</p>
        </div>
      ) : repo ? (
        <>
          <div className={styles.tabs}>
            <button
              type="button"
              data-on={detailTab === 'pulls'}
              onClick={() => setDetailTab('pulls')}
            >
              <span className="material-icons">call_split</span>
              Pull requests
              {detail ? <em>{detail.pulls.length}</em> : null}
            </button>
            <button
              type="button"
              data-on={detailTab === 'issues'}
              onClick={() => setDetailTab('issues')}
            >
              <span className="material-icons">error_outline</span>
              Issues
              {detail ? <em>{detail.issues.length}</em> : null}
            </button>
            <div className={styles.segment}>
              <button
                type="button"
                data-on={state === 'open'}
                onClick={() => setState('open')}
              >
                Open
              </button>
              <button
                type="button"
                data-on={state === 'closed'}
                onClick={() => setState('closed')}
              >
                Closed
              </button>
            </div>
          </div>
          <div className={styles.list}>
            {detailError ? (
              <div className={styles.empty}>
                {ERRORS[detailError] ?? detailError}
              </div>
            ) : !detail ? (
              <div className={styles.empty}>Loading…</div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>
                No {state}{' '}
                {detailTab === 'pulls' ? 'pull requests' : 'issues'}
              </div>
            ) : (
              items.map(item => (
                <div key={item.number} className={styles.item}>
                  <span
                    className={`material-icons ${styles.itemIcon}`}
                    data-kind={
                      item.merged
                        ? 'merged'
                        : item.draft
                          ? 'draft'
                          : item.state
                    }
                  >
                    {detailTab === 'pulls'
                      ? item.merged
                        ? 'merge_type'
                        : 'call_split'
                      : item.state === 'open'
                        ? 'error_outline'
                        : 'check_circle_outline'}
                  </span>
                  <div className={styles.itemMain}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <div className={styles.itemMeta}>
                      #{item.number} · {item.author} ·{' '}
                      {ago(item.updatedAt)}
                      {item.draft ? ' · draft' : ''}
                      {item.comments ? ` · ${item.comments} comments` : ''}
                    </div>
                    {item.labels.length ? (
                      <div className={styles.labels}>
                        {item.labels.slice(0, 4).map(l => (
                          <span
                            key={l.name}
                            style={{
                              borderColor: `#${l.color}`,
                              color: `#${l.color}`
                            }}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className={styles.tabs}>
            <button
              type="button"
              data-on={tab === 'repos'}
              onClick={() => setTab('repos')}
            >
              <span className="material-icons">book</span>
              Repositories
              <em>{overview.repos.length}</em>
            </button>
            <button
              type="button"
              data-on={tab === 'starred'}
              onClick={() => setTab('starred')}
            >
              <span className="material-icons">star_border</span>
              Starred
              <em>{overview.starred.length}</em>
            </button>
            <div className={styles.updated}>
              Updated {ago(new Date(overview.fetchedAt).toISOString())}
            </div>
          </div>
          <div className={styles.list}>
            {repos.length === 0 ? (
              <div className={styles.empty}>Nothing here yet</div>
            ) : (
              repos.map(r => (
                <button
                  key={r.fullName}
                  type="button"
                  className={styles.repo}
                  onClick={() => {
                    setState('open')
                    setDetailTab('pulls')
                    setRepo(r)
                  }}
                >
                  <div className={styles.repoTop}>
                    <span className={styles.repoName}>
                      {tab === 'starred' ? `${r.owner}/` : ''}
                      <strong>{r.name}</strong>
                    </span>
                    {r.private ? (
                      <span className={styles.badge}>Private</span>
                    ) : null}
                    <span className="material-icons">chevron_right</span>
                  </div>
                  {r.description ? (
                    <div className={styles.repoDesc}>{r.description}</div>
                  ) : null}
                  <div className={styles.repoStats}>
                    {r.language ? (
                      <span>
                        <i
                          style={{
                            background:
                              LANG_COLORS[r.language] ?? '#8b949e'
                          }}
                        />
                        {r.language}
                      </span>
                    ) : null}
                    <span>
                      <span className="material-icons">star_border</span>
                      {compact(r.stars)}
                    </span>
                    <span>
                      <span className="material-icons">call_split</span>
                      {compact(r.forks)}
                    </span>
                    <span>{r.openIssues} open</span>
                    <span>{ago(r.updatedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default GitHubApp
