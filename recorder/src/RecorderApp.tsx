import { useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { formatMs, useSocketMessage } from './shared.tsx'

import styles from './RecorderApp.module.css'

interface RecordingInfo {
  name: string
  createdAt: number
  durationMs: number
}

type RecorderMessage =
  | { kind: 'state'; recording: boolean; startedAt: number | null }
  | { kind: 'level'; level: number; elapsedMs: number }
  | { kind: 'saved'; recording: RecordingInfo | null }
  | { kind: 'error'; message: string }

const BARS = 48

function label(r: RecordingInfo) {
  const d = new Date(r.createdAt)
  return {
    title: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    date: d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }
}

const RecorderApp: React.FC = () => {
  const { closeApp } = useApps()
  const [recording, setRecording] = useState(false)
  const [pending, setPending] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0))
  const [list, setList] = useState<RecordingInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState<string | null>(null)

  const { ready, socket } = useSocketMessage<RecorderMessage | RecordingInfo[]>(
    'recorder',
    (data, action) => {
      if (action === 'list') return setList(data as RecordingInfo[])
      const msg = data as RecorderMessage
      if (msg.kind === 'state') {
        setRecording(msg.recording)
        setPending(false)
        if (msg.recording) {
          setError(null)
          setElapsed(msg.startedAt ? Date.now() - msg.startedAt : 0)
        } else setLevels(Array(BARS).fill(0))
      } else if (msg.kind === 'level') {
        setElapsed(msg.elapsedMs)
        setLevels(l => [...l.slice(1), Math.min(1, msg.level * 4)])
      } else if (msg.kind === 'saved') {
        setJustSaved(msg.recording?.name ?? null)
      } else if (msg.kind === 'error') {
        setError(msg.message)
        setPending(false)
      }
    }
  )

  useEffect(() => {
    if (!ready || !socket) return
    socket.send(JSON.stringify({ type: 'recorder', action: 'watch' }))
    return () => {
      socket.send(JSON.stringify({ type: 'recorder', action: 'unwatch' }))
    }
  }, [ready, socket])

  useEffect(() => {
    if (!justSaved) return
    const id = setTimeout(() => setJustSaved(null), 4000)
    return () => clearTimeout(id)
  }, [justSaved])

  const send = (action: string, data?: unknown) =>
    socket?.send(JSON.stringify({ type: 'recorder', action, data }))

  function toggle() {
    if (pending) return
    setPending(true)
    send(recording ? 'stop' : 'start')
  }

  function remove(name: string) {
    if (confirmDelete !== name) return setConfirmDelete(name)
    setConfirmDelete(null)
    send('delete', { name })
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={closeApp}>
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Recording Notes</div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => send('reveal')}
        >
          <span className="material-icons">folder_open</span>
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.recorder} data-recording={recording}>
          <div className={styles.meter}>
            {levels.map((v, i) => (
              <span key={i} style={{ height: `${Math.max(4, v * 100)}%` }} />
            ))}
          </div>
          <div className={styles.elapsed}>{formatMs(recording ? elapsed : 0)}</div>
          <button
            type="button"
            className={styles.record}
            data-recording={recording}
            data-pending={pending}
            onClick={toggle}
          >
            <span />
          </button>
          <div className={styles.status}>
            {pending
              ? recording
                ? 'Saving…'
                : 'Starting microphone…'
              : recording
                ? 'Recording from the Car Thing mic'
                : justSaved
                  ? 'Saved to your computer'
                  : 'Tap to record a note'}
          </div>
          {error ? <div className={styles.error}>{error}</div> : null}
        </div>

        <div className={styles.listWrap}>
          <div className={styles.sectionLabel}>
            {list.length} {list.length === 1 ? 'note' : 'notes'} · play on your computer
          </div>
          <div className={styles.list}>
            {list.length === 0 ? (
              <div className={styles.empty}>No recordings yet</div>
            ) : (
              list.map(r => {
                const { title, date } = label(r)
                return (
                  <div
                    key={r.name}
                    className={styles.item}
                    data-new={r.name === justSaved}
                  >
                    <button
                      type="button"
                      className={styles.play}
                      onClick={() => send('play', { name: r.name })}
                    >
                      <span className="material-icons">play_arrow</span>
                    </button>
                    <div className={styles.itemText}>
                      <div>{title}</div>
                      <small>
                        {date} · {formatMs(r.durationMs)}
                      </small>
                    </div>
                    <button
                      type="button"
                      className={styles.delete}
                      data-confirm={confirmDelete === r.name}
                      onClick={() => remove(r.name)}
                    >
                      <span className="material-icons">
                        {confirmDelete === r.name ? 'delete_forever' : 'delete'}
                      </span>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecorderApp
