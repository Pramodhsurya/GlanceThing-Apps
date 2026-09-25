import { useContext, useEffect, useRef, useState } from 'react'

import { MediaContext } from '@/contexts/MediaContext.tsx'
import { useApps } from '@/contexts/AppsContext.tsx'
import { SeekBar, useSocketMessage } from './shared.tsx'

import type { Action, RepeatMode } from '@/types/Playback.js'

import styles from './MusicApp.module.css'

const JUMP_MS = 10_000
const VOLUME_STEP = 10

const REPEAT_NEXT: Record<RepeatMode, RepeatMode> = {
  off: 'on',
  on: 'one',
  one: 'off'
}

interface SourcesInfo {
  current: string | null
  sources: { name: string; ready: boolean }[]
}

const SOURCE_LABEL: Record<
  string,
  { label: string; icon: string; unavailable: string }
> = {
  native: {
    label: 'This computer',
    icon: 'computer',
    unavailable: 'Not available'
  },
  spotify: {
    label: 'Spotify',
    icon: 'music_note',
    unavailable: 'Set up in the desktop app'
  },
  applemusic: {
    label: 'Apple Music',
    icon: 'library_music',
    unavailable: 'Music app not found'
  },
  youtubemusic: {
    label: 'YouTube Music',
    icon: 'smart_display',
    unavailable: 'Open YouTube Music with the API Server plugin on'
  }
}

function sourceMeta(name: string | null | undefined) {
  if (!name)
    return { label: 'No source', icon: 'speaker', unavailable: '' }
  return (
    SOURCE_LABEL[name] ?? {
      label: name,
      icon: 'graphic_eq',
      unavailable: 'Not available'
    }
  )
}

const MusicApp: React.FC = () => {
  const { image, playerData, actions } = useContext(MediaContext)
  const { closeApp } = useApps()
  const [info, setInfo] = useState<SourcesInfo | null>(null)
  const [switching, setSwitching] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [dialing, setDialing] = useState(false)
  const [localVolume, setLocalVolume] = useState(50)
  const volumeRef = useRef(50)
  const lastDialAt = useRef(0)
  const actionsRef = useRef(actions)
  const pickingRef = useRef(picking)
  actionsRef.current = actions
  pickingRef.current = picking

  const { ready, socket } = useSocketMessage<SourcesInfo>(
    'playback',
    (data, action) => {
      if (action !== 'sources') return
      setInfo(data)
      if (switching) setPicking(false)
      setSwitching(null)
    }
  )

  useEffect(() => {
    if (!ready || !socket) return
    socket.send(JSON.stringify({ type: 'playback', action: 'sources' }))
  }, [ready, socket])

  function switchTo(name: string) {
    if (!socket) return
    if (name === info?.current) return setPicking(false)
    setSwitching(name)
    socket.send(
      JSON.stringify({ type: 'playback', action: 'source', data: { name } })
    )
  }

  const can = (action: Action) =>
    !!playerData?.supportedActions.includes(action)

  useEffect(() => {
    if (typeof playerData?.volume === 'number') setLocalVolume(playerData.volume)
  }, [playerData?.volume])

  volumeRef.current = localVolume

  function applyVolume(next: number) {
    const volume = Math.max(0, Math.min(100, next))
    volumeRef.current = volume
    setLocalVolume(volume)
    actions.setVolume(volume)
  }

  useEffect(() => {
    function bump(delta: number) {
      if (pickingRef.current) return
      const now = Date.now()
      if (now - lastDialAt.current < 40) return
      lastDialAt.current = now
      const next = Math.max(
        0,
        Math.min(100, volumeRef.current + delta * VOLUME_STEP)
      )
      if (next === volumeRef.current) return
      volumeRef.current = next
      actionsRef.current.setVolume(next)
      setLocalVolume(next)
      setDialing(true)
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        bump(-1)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        bump(1)
      } else if (e.key === 'Enter') {
        if (pickingRef.current) return
        e.preventDefault()
        e.stopPropagation()
        actionsRef.current.playPause()
      }
    }

    function onWheel(e: WheelEvent) {
      const amount =
        Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!amount) return
      e.preventDefault()
      e.stopPropagation()
      bump(amount > 0 ? 1 : -1)
    }

    document.addEventListener('keydown', onKey, true)
    document.addEventListener('wheel', onWheel, {
      capture: true,
      passive: false
    })
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('wheel', onWheel, true)
    }
  }, [])

  useEffect(() => {
    if (!dialing) return
    const id = window.setTimeout(() => setDialing(false), 800)
    return () => window.clearTimeout(id)
  }, [dialing, playerData?.volume])

  const current = playerData?.track.duration.current ?? 0
  const total = playerData?.track.duration.total ?? 0
  const volume = localVolume
  const source = sourceMeta(info?.current)

  const volumeBar = (
    <div
      className={styles.volume}
      data-enabled={playerData ? can('volume') : true}
      data-dialing={dialing}
    >
      <button
        type="button"
        disabled={!!playerData && !can('volume')}
        onClick={() => applyVolume(volume - VOLUME_STEP)}
      >
        <span className="material-icons">volume_down</span>
      </button>
      <div className={styles.volumeTrack}>
        <div
          className={styles.volumeFill}
          style={{ width: `${volume}%` }}
        />
      </div>
      <button
        type="button"
        disabled={!!playerData && !can('volume')}
        onClick={() => applyVolume(volume + VOLUME_STEP)}
      >
        <span className="material-icons">volume_up</span>
      </button>
    </div>
  )

  return (
    <div className={styles.shell}>
      {image ? (
        <div
          className={styles.backdrop}
          style={{ backgroundImage: `url(${image})` }}
        />
      ) : null}

      <div className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={closeApp}>
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Music</div>
        <button
          type="button"
          className={styles.sourceChip}
          onClick={() => setPicking(true)}
        >
          <span className="material-icons">{source.icon}</span>
          {source.label}
          <span className="material-icons">expand_more</span>
        </button>
      </div>

      {playerData ? (
        <div className={styles.body}>
          <div className={styles.art}>
            {image ? (
              <img src={image} alt="" />
            ) : (
              <span className="material-icons">music_note</span>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.meta}>
              <div className={styles.trackName}>{playerData.track.name}</div>
              <div className={styles.artist}>
                {playerData.track.artists.join(', ')}
              </div>
              {playerData.track.album ? (
                <div className={styles.album}>{playerData.track.album}</div>
              ) : null}
            </div>

            <SeekBar
              current={current}
              total={total}
              enabled={can('seek')}
              accent="#c084fc"
              onSeek={actions.seek}
            />

            <div className={styles.transport}>
              <button
                type="button"
                disabled={!can('seek')}
                onClick={() => actions.seek(current - JUMP_MS)}
              >
                <span className="material-icons">replay_10</span>
              </button>
              <button
                type="button"
                disabled={!can('previous')}
                onClick={actions.skipBackward}
              >
                <span className="material-icons">skip_previous</span>
              </button>
              <button
                type="button"
                data-primary="true"
                onClick={actions.playPause}
              >
                <span className="material-icons">
                  {playerData.isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button
                type="button"
                disabled={!can('next')}
                onClick={actions.skipForward}
              >
                <span className="material-icons">skip_next</span>
              </button>
              <button
                type="button"
                disabled={!can('seek')}
                onClick={() => actions.seek(current + JUMP_MS)}
              >
                <span className="material-icons">forward_10</span>
              </button>
            </div>

            <div className={styles.extras}>
              <button
                type="button"
                className={styles.toggle}
                disabled={!can('shuffle')}
                data-on={playerData.shuffle}
                onClick={() => actions.shuffle(!playerData.shuffle)}
              >
                <span className="material-icons">shuffle</span>
              </button>
              <button
                type="button"
                className={styles.toggle}
                disabled={!can('repeat')}
                data-on={playerData.repeat !== 'off'}
                onClick={() => actions.repeat(REPEAT_NEXT[playerData.repeat])}
              >
                <span className="material-icons">
                  {playerData.repeat === 'one' ? 'repeat_one' : 'repeat'}
                </span>
              </button>

              {volumeBar}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.empty}>
          <span className="material-icons">disc_full</span>
          <p>Nothing is playing</p>
          <small>
            {info?.current === 'native'
              ? 'Play something on your computer to control it here.'
              : `No audio from ${source.label}. Start playback, or pick another source.`}
          </small>
          <button
            type="button"
            className={styles.emptyBtn}
            onClick={() => setPicking(true)}
          >
            Change source
          </button>
          <div className={styles.emptyVolume}>{volumeBar}</div>
        </div>
      )}

      {picking ? (
        <div className={styles.sheetScrim} onClick={() => setPicking(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetTitle}>Play from</div>
            <div className={styles.sourceGrid}>
            {(info?.sources ?? []).map(s => {
              const meta = sourceMeta(s.name)
              const active = info?.current === s.name
              return (
                <button
                  key={s.name}
                  type="button"
                  className={styles.source}
                  data-active={active}
                  disabled={!s.ready || switching !== null}
                  onClick={() => switchTo(s.name)}
                >
                  <span className="material-icons">{meta.icon}</span>
                  <div className={styles.sourceText}>
                    <div>{meta.label}</div>
                    <small>
                      {switching === s.name
                        ? 'Switching…'
                        : active
                          ? 'In use'
                          : s.ready
                            ? 'Tap to use'
                            : meta.unavailable}
                    </small>
                  </div>
                  {active ? (
                    <span className="material-icons">check_circle</span>
                  ) : null}
                </button>
              )
            })}
            </div>
            {!info ? (
              <div className={styles.hint}>Loading sources…</div>
            ) : (
              <div className={styles.hint}>
                “This computer” controls whatever is playing on your Mac or
                PC, such as a browser or VLC.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MusicApp
