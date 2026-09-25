import { useContext, useEffect, useRef, useState } from 'react'

import { SocketContext } from '@/contexts/SocketContext.tsx'

import styles from './shared.module.css'

export function formatMs(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

export function useSocketMessage<T>(
  type: string,
  onMessage: (data: T, action?: string) => void
) {
  const { ready, socket } = useContext(SocketContext)
  const handlerRef = useRef(onMessage)
  handlerRef.current = onMessage

  useEffect(() => {
    if (!ready || !socket) return
    const listener = (e: MessageEvent) => {
      const msg = JSON.parse(e.data)
      if (msg.type === type) handlerRef.current(msg.data, msg.action)
    }
    socket.addEventListener('message', listener)
    return () => socket.removeEventListener('message', listener)
  }, [ready, socket, type])

  return { ready, socket }
}

interface SeekBarProps {
  current: number
  total: number
  enabled: boolean
  accent?: string
  onSeek: (positionMs: number) => void
}

export const SeekBar: React.FC<SeekBarProps> = ({
  current,
  total,
  enabled,
  accent = '#fff',
  onSeek
}) => {
  const barRef = useRef<HTMLDivElement>(null)
  const [dragRatio, setDragRatio] = useState<number | null>(null)

  const ratio =
    dragRatio ?? (total > 0 ? Math.min(1, Math.max(0, current / total)) : 0)

  function ratioAt(clientX: number) {
    const rect = barRef.current!.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!enabled || total <= 0) return
    e.stopPropagation()
    barRef.current?.setPointerCapture(e.pointerId)
    setDragRatio(ratioAt(e.clientX))
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragRatio === null) return
    setDragRatio(ratioAt(e.clientX))
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragRatio === null) return
    const final = ratioAt(e.clientX)
    setDragRatio(null)
    onSeek(final * total)
  }

  return (
    <div className={styles.seek} data-enabled={enabled}>
      <div
        ref={barRef}
        className={styles.seekHit}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDragRatio(null)}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        <div className={styles.seekTrack}>
          <div
            className={styles.seekFill}
            style={{ width: `${ratio * 100}%`, background: accent }}
          />
          {enabled ? (
            <div
              className={styles.seekKnob}
              data-dragging={dragRatio !== null}
              style={{ left: `${ratio * 100}%`, background: accent }}
            />
          ) : null}
        </div>
      </div>
      <div className={styles.seekTimes}>
        <span>{formatMs(ratio * total)}</span>
        <span>{formatMs(total)}</span>
      </div>
    </div>
  )
}
