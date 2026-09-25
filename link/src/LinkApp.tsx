import { useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { useSocketMessage } from './shared.tsx'

import styles from './LinkApp.module.css'

interface LinkClient {
  id: string
  name: string
  color: string
  score: number
}

interface LinkState {
  you: string | null
  clients: LinkClient[]
}

const COLORS = [
  '#38bdf8',
  '#f472b6',
  '#facc15',
  '#34d399',
  '#a78bfa',
  '#fb923c'
]

const LinkApp: React.FC = () => {
  const { closeApp } = useApps()
  const [state, setState] = useState<LinkState>({ you: null, clients: [] })
  const [pulse, setPulse] = useState(0)

  const { ready, socket } = useSocketMessage<LinkState>(
    'link',
    (data, action) => {
      if (action === 'state') setState(data)
    }
  )

  useEffect(() => {
    if (!ready || !socket) return
    socket.send(JSON.stringify({ type: 'link', action: 'join' }))
    return () => {
      socket.send(JSON.stringify({ type: 'link', action: 'leave' }))
    }
  }, [ready, socket])

  const send = (action: string, data?: unknown) =>
    socket?.send(JSON.stringify({ type: 'link', action, data }))

  const me = state.clients.find(c => c.id === state.you)
  const ranked = [...state.clients].sort((a, b) => b.score - a.score)
  const top = Math.max(1, ...state.clients.map(c => c.score))

  function tap() {
    send('tap', { inc: 1 })
    setPulse(p => p + 1)
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={closeApp}
        >
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Link</div>
        <div className={styles.status} data-online={ready}>
          <span />
          {state.clients.length} connected
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.pad}
            style={{ background: me?.color ?? '#333' }}
            onClick={tap}
            disabled={!me}
          >
            <span key={pulse} className={styles.ripple} />
            <div className={styles.padScore}>{me?.score ?? 0}</div>
            <div className={styles.padHint}>
              {me ? 'Tap!' : 'Joining…'}
            </div>
          </button>
          <div className={styles.swatches}>
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                style={{ background: color }}
                data-on={me?.color === color}
                onClick={() => send('color', { color })}
              />
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.sectionLabel}>Linked devices</div>
          <div className={styles.board}>
            {ranked.map((c, i) => (
              <div
                key={c.id}
                className={styles.row}
                data-me={c.id === state.you}
              >
                <div className={styles.rank}>{i + 1}</div>
                <div className={styles.rowMain}>
                  <div className={styles.rowTop}>
                    <span>
                      {c.name}
                      {c.id === state.you ? ' (you)' : ''}
                    </span>
                    <strong>{c.score}</strong>
                  </div>
                  <div className={styles.bar}>
                    <div
                      style={{
                        width: `${(c.score / top) * 100}%`,
                        background: c.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {state.clients.length <= 1 ? (
            <div className={styles.hint}>
              Open Link on another screen connected to this computer and
              your taps and colours sync live.
            </div>
          ) : null}
          <button
            type="button"
            className={styles.reset}
            onClick={() => send('reset')}
          >
            <span className="material-icons">restart_alt</span>
            Reset scores
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinkApp
