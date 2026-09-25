import { useEffect, useRef, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { useSocketMessage } from './shared.tsx'

import styles from './MicApp.module.css'

interface MicDevice {
  name: string
  muted: boolean
  canMute: boolean
  active: boolean
}

interface MicState {
  muted: boolean
  active: boolean
  selected: string[]
  devices: MicDevice[]
  autoOpen: boolean
}

const MicApp: React.FC = () => {
  const { closeApp } = useApps()
  const [state, setState] = useState<MicState>({
    muted: false,
    active: false,
    selected: [],
    devices: [],
    autoOpen: true
  })
  const [pending, setPending] = useState(false)
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)
  const pickingRef = useRef(false)
  const socketRef = useRef<WebSocket | null>(null)
  pendingRef.current = pending
  pickingRef.current = picking

  const { ready, socket } = useSocketMessage<
    MicState | { message: string }
  >('mic', (data, action) => {
    if (action === 'error') {
      setError((data as { message: string }).message)
      setPending(false)
      return
    }
    if (action === 'state') {
      setState(data as MicState)
      setPending(false)
      setError(null)
    }
  })
  socketRef.current = socket

  useEffect(() => {
    if (!ready || !socket) return
    socket.send(JSON.stringify({ type: 'mic', action: 'watch' }))
    return () => {
      socket.send(JSON.stringify({ type: 'mic', action: 'unwatch' }))
    }
  }, [ready, socket])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && pickingRef.current) {
        e.preventDefault()
        e.stopPropagation()
        setPicking(false)
        return
      }
      if (e.key !== 'Enter' || pickingRef.current) return
      e.preventDefault()
      e.stopPropagation()
      if (pendingRef.current || !socketRef.current) return
      pendingRef.current = true
      setPending(true)
      socketRef.current.send(
        JSON.stringify({ type: 'mic', action: 'toggle' })
      )
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [])

  function toggle() {
    if (pending || !socket) return
    setPending(true)
    socket.send(JSON.stringify({ type: 'mic', action: 'toggle' }))
  }

  function toggleAutoOpen() {
    if (!socket) return
    socket.send(
      JSON.stringify({
        type: 'mic',
        action: 'autoOpen',
        data: { on: !state.autoOpen }
      })
    )
  }

  function toggleDevice(name: string) {
    if (!socket) return
    const on = state.selected.indexOf(name) !== -1
    const next = on
      ? state.selected.filter(n => n !== name)
      : state.selected.concat(name)
    socket.send(
      JSON.stringify({
        type: 'mic',
        action: 'select',
        data: {
          names: next.length ? next : state.devices.map(d => d.name)
        }
      })
    )
  }

  const allOn =
    state.devices.length > 0 &&
    state.selected.length === state.devices.length
  const chip =
    state.selected.length === 0 || allOn
      ? 'All mics'
      : state.selected.length === 1
        ? state.selected[0]
        : `${state.selected.length} mics`

  return (
    <div className={styles.shell} data-muted={state.muted}>
      <button type="button" className={styles.back} onClick={closeApp}>
        <span className="material-icons">keyboard_arrow_down</span>
      </button>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setPicking(true)}
      >
        <span className="material-icons">expand_more</span>
        {chip}
      </button>
      <button
        type="button"
        className={styles.mic}
        data-muted={state.muted}
        data-pending={pending}
        onClick={toggle}
        aria-pressed={state.muted}
      >
        <span className="material-icons">
          {state.muted ? 'mic_off' : 'mic'}
        </span>
      </button>
      <button
        type="button"
        className={styles.auto}
        data-on={state.autoOpen}
        onClick={toggleAutoOpen}
      >
        <span className="material-icons">
          {state.autoOpen ? 'notifications_active' : 'notifications_off'}
        </span>
        <div className={styles.autoText}>
          <strong>Pop up when in use</strong>
          <small>
            {state.autoOpen
              ? 'On — opens when a selected mic is active'
              : 'Off — stays closed until you open it'}
          </small>
        </div>
        <span className={styles.switch} data-on={state.autoOpen} />
      </button>
      {error ? <div className={styles.error}>{error}</div> : null}

      {picking ? (
        <div
          className={styles.sheetScrim}
          onClick={() => setPicking(false)}
        >
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetTitle}>Microphones</div>
            {state.devices.map(device => {
              const on = state.selected.indexOf(device.name) !== -1
              return (
                <button
                  key={device.name}
                  type="button"
                  className={styles.row}
                  data-on={on}
                  data-active={device.active}
                  onClick={() => toggleDevice(device.name)}
                >
                  <span className="material-icons">
                    {device.muted ? 'mic_off' : 'mic'}
                  </span>
                  <div className={styles.rowText}>
                    <div>{device.name}</div>
                    <small>
                      {device.active
                        ? 'In use'
                        : device.canMute
                          ? on
                            ? 'Selected'
                            : 'Tap to include'
                          : 'Listed — this mic cannot be muted from here'}
                    </small>
                  </div>
                  {on ? (
                    <span className="material-icons">check_circle</span>
                  ) : null}
                </button>
              )
            })}
            {state.devices.length === 0 ? (
              <div className={styles.empty}>No microphones found</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MicApp
