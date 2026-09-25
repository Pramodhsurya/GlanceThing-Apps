import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { useSocketMessage } from './shared.tsx'

import styles from './LogsApp.module.css'

type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
type Filter = 'ALL' | 'WARN' | 'ERROR'

interface LogLine {
  id: number
  time: string
  level: Level
  scope: string
  text: string
}

const MAX_LINES = 500
const LINE_RE = /^\[([^\]]+)\]\s+(DEBUG|INFO|WARN|ERROR)(?:\s+<([^>]+)>:)?\s?(.*)$/

let nextId = 0

function parse(raw: string): LogLine {
  const m = raw.match(LINE_RE)
  if (!m) return { id: nextId++, time: '', level: 'INFO', scope: '', text: raw }
  return {
    id: nextId++,
    time: m[1],
    level: m[2] as Level,
    scope: m[3] ?? '',
    text: m[4]
  }
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'WARN', label: 'Warnings+' },
  { id: 'ERROR', label: 'Errors' }
]

const LogsApp: React.FC = () => {
  const { closeApp } = useApps()
  const [lines, setLines] = useState<LogLine[]>([])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [scope, setScope] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const listRef = useRef<HTMLDivElement>(null)

  const { ready, socket } = useSocketMessage<string | string[]>(
    'logs',
    (data, action) => {
      if (action === 'history' && Array.isArray(data))
        setLines(data.map(parse).slice(-MAX_LINES))
      else if (action === 'line' && typeof data === 'string')
        setLines(l => [...l, parse(data)].slice(-MAX_LINES))
    }
  )

  useEffect(() => {
    if (!ready || !socket) return
    socket.send(JSON.stringify({ type: 'logs', action: 'subscribe' }))
    return () => {
      socket.send(JSON.stringify({ type: 'logs', action: 'unsubscribe' }))
    }
  }, [ready, socket])

  const scopes = useMemo(() => {
    const counts = new Map<string, number>()
    lines.forEach(l => l.scope && counts.set(l.scope, (counts.get(l.scope) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0])
  }, [lines])

  const visible = lines.filter(l => {
    if (filter === 'WARN' && l.level !== 'WARN' && l.level !== 'ERROR') return false
    if (filter === 'ERROR' && l.level !== 'ERROR') return false
    if (scope && l.scope !== scope) return false
    return true
  })

  const counts = {
    warn: lines.filter(l => l.level === 'WARN').length,
    error: lines.filter(l => l.level === 'ERROR').length
  }

  useLayoutEffect(() => {
    if (pausedRef.current || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [visible.length, filter, scope])

  function onScroll() {
    const el = listRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
    if (atBottom === pausedRef.current) setPaused(!atBottom)
  }

  function jumpToEnd() {
    setPaused(false)
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={closeApp}>
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Console Logs</div>
        <div className={styles.badges}>
          <span data-kind="warn">{counts.warn} warn</span>
          <span data-kind="error">{counts.error} error</span>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setLines([])}
        >
          <span className="material-icons">delete_sweep</span>
        </button>
      </div>

      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            data-on={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span className={styles.divider} />
        {scopes.map(s => (
          <button
            key={s}
            type="button"
            data-on={scope === s}
            data-scope="true"
            onClick={() => setScope(scope === s ? null : s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={styles.list} ref={listRef} onScroll={onScroll}>
        {visible.length === 0 ? (
          <div className={styles.empty}>
            {ready ? 'No log lines yet' : 'Connecting to GlanceThing…'}
          </div>
        ) : (
          visible.map(l => (
            <div key={l.id} className={styles.line} data-level={l.level}>
              <span className={styles.time}>{l.time}</span>
              <span className={styles.level}>{l.level}</span>
              {l.scope ? <span className={styles.scope}>{l.scope}</span> : null}
              <span className={styles.text}>{l.text}</span>
            </div>
          ))
        )}
      </div>

      {paused ? (
        <button type="button" className={styles.follow} onClick={jumpToEnd}>
          <span className="material-icons">arrow_downward</span>
          Follow live
        </button>
      ) : null}
    </div>
  )
}

export default LogsApp
