import { useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { usePersistentState } from './usePersistentState.ts'

import styles from './PomodoroApp.module.css'

type Mode = 'focus' | 'short' | 'long' | 'done'

interface Settings {
  blocks: number
  focusMin: number
  shortMin: number
  longMin: number
  focusColor: string
  breakColor: string
  flash: boolean
}

interface Timer {
  mode: Mode
  session: number
  running: boolean
  endAt: number
  remainingMs: number
}

const DEFAULT_SETTINGS: Settings = {
  blocks: 4,
  focusMin: 25,
  shortMin: 5,
  longMin: 20,
  focusColor: '#f87171',
  breakColor: '#34d399',
  flash: true
}

const SWATCHES = [
  '#f87171',
  '#fb923c',
  '#facc15',
  '#34d399',
  '#22d3ee',
  '#818cf8',
  '#e879f9'
]

const MODE_LABEL: Record<Mode, string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
  done: 'All done'
}

const MODE_ICON: Record<Mode, string> = {
  focus: 'psychology',
  short: 'local_cafe',
  long: 'self_improvement',
  done: 'celebration'
}

function durationFor(mode: Mode, s: Settings) {
  if (mode === 'focus') return s.focusMin * 60_000
  if (mode === 'short') return s.shortMin * 60_000
  if (mode === 'long') return s.longMin * 60_000
  return 0
}

function freshTimer(s: Settings): Timer {
  return {
    mode: 'focus',
    session: 0,
    running: false,
    endAt: 0,
    remainingMs: durationFor('focus', s)
  }
}

function nextPhase(t: Timer, s: Settings): Pick<Timer, 'mode' | 'session'> {
  if (t.mode === 'focus')
    return {
      mode: t.session >= s.blocks - 1 ? 'long' : 'short',
      session: t.session
    }
  if (t.mode === 'short') return { mode: 'focus', session: t.session + 1 }
  return { mode: 'done', session: t.session }
}

function previousPhase(
  t: Timer,
  s: Settings
): Pick<Timer, 'mode' | 'session'> {
  if (t.mode === 'done') return { mode: 'long', session: s.blocks - 1 }
  if (t.mode === 'short' || t.mode === 'long')
    return { mode: 'focus', session: t.session }
  if (t.session === 0) return { mode: 'focus', session: 0 }
  return { mode: 'short', session: t.session - 1 }
}

function enter(
  phase: Pick<Timer, 'mode' | 'session'>,
  s: Settings,
  running: boolean,
  from = Date.now()
): Timer {
  const duration = durationFor(phase.mode, s)
  const keepRunning = running && phase.mode !== 'done'
  return {
    ...phase,
    running: keepRunning,
    endAt: keepRunning ? from + duration : 0,
    remainingMs: duration
  }
}

function remainingOf(t: Timer, now: number) {
  return t.running ? Math.max(0, t.endAt - now) : t.remainingMs
}

function catchUp(t: Timer, s: Settings, now: number) {
  let timer = t
  let advanced = false
  while (timer.running && timer.endAt <= now) {
    timer = enter(nextPhase(timer, s), s, true, timer.endAt)
    advanced = true
  }
  return { timer, advanced }
}

function formatTime(ms: number) {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const sec = total % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const RING = 2 * Math.PI * 88

const PomodoroApp: React.FC = () => {
  const { closeApp } = useApps()
  const [settings, setSettings] = usePersistentState(
    'gt.pomodoro.settings',
    DEFAULT_SETTINGS
  )
  const [timer, setTimer] = usePersistentState<Timer>(
    'gt.pomodoro.timer',
    freshTimer(DEFAULT_SETTINGS)
  )
  const [now, setNow] = useState(Date.now())
  const [flashKey, setFlashKey] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const { timer: caught, advanced } = catchUp(timer, settings, now)
    if (!advanced) return
    setTimer(caught)
    if (settings.flash) setFlashKey(k => k + 1)
  }, [now, timer, settings, setTimer])

  const remaining = remainingOf(timer, now)
  const total = durationFor(timer.mode, settings) || 1
  const progress = timer.mode === 'done' ? 1 : 1 - remaining / total
  const isBreak = timer.mode === 'short' || timer.mode === 'long'
  const accent = isBreak ? settings.breakColor : settings.focusColor

  function toggle() {
    const t = Date.now()
    if (timer.mode === 'done') return setTimer(enter({ mode: 'focus', session: 0 }, settings, true, t))
    if (timer.running)
      setTimer({ ...timer, running: false, remainingMs: remainingOf(timer, t) })
    else setTimer({ ...timer, running: true, endAt: t + timer.remainingMs })
  }

  function skip() {
    setTimer(enter(nextPhase(timer, settings), settings, timer.running))
  }

  function back() {
    const elapsed = total - remaining
    const restartOnly =
      elapsed > 3000 || (timer.mode === 'focus' && timer.session === 0)
    const phase = restartOnly
      ? { mode: timer.mode, session: timer.session }
      : previousPhase(timer, settings)
    setTimer(enter(phase, settings, timer.running))
  }

  function reset() {
    setTimer(freshTimer(settings))
  }

  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (!timer.running) {
      const session = Math.min(timer.session, next.blocks - 1)
      setTimer(enter({ mode: timer.mode, session }, next, false))
    }
  }

  return (
    <div
      className={styles.shell}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      {flashKey > 0 ? <div key={flashKey} className={styles.flash} /> : null}
      <div className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={closeApp}>
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Pomodoro</div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setShowSettings(v => !v)}
          data-active={showSettings}
        >
          <span className="material-icons">
            {showSettings ? 'close' : 'tune'}
          </span>
        </button>
      </div>

      {showSettings ? (
        <div className={styles.settings}>
          <Stepper
            label="Focus blocks"
            value={settings.blocks}
            min={1}
            max={10}
            onChange={blocks => updateSettings({ blocks })}
          />
          <Stepper
            label="Focus (min)"
            value={settings.focusMin}
            min={1}
            max={90}
            step={5}
            onChange={focusMin => updateSettings({ focusMin })}
          />
          <Stepper
            label="Short break (min)"
            value={settings.shortMin}
            min={1}
            max={30}
            onChange={shortMin => updateSettings({ shortMin })}
          />
          <Stepper
            label="Long break (min)"
            value={settings.longMin}
            min={1}
            max={60}
            step={5}
            onChange={longMin => updateSettings({ longMin })}
          />
          <Swatches
            label="Focus colour"
            value={settings.focusColor}
            onChange={focusColor => updateSettings({ focusColor })}
          />
          <Swatches
            label="Break colour"
            value={settings.breakColor}
            onChange={breakColor => updateSettings({ breakColor })}
          />
          <div className={styles.row}>
            <span>Flash screen when a phase ends</span>
            <button
              type="button"
              className={styles.toggle}
              data-on={settings.flash}
              onClick={() => updateSettings({ flash: !settings.flash })}
            >
              <span />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.ringWrap}>
            <svg viewBox="0 0 200 200" className={styles.ring}>
              <circle cx="100" cy="100" r="88" className={styles.track} />
              <circle
                cx="100"
                cy="100"
                r="88"
                className={styles.fill}
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - progress)}
              />
            </svg>
            <div className={styles.ringInner}>
              <span className="material-icons">{MODE_ICON[timer.mode]}</span>
              <div className={styles.clock}>
                {timer.mode === 'done' ? '🎉' : formatTime(remaining)}
              </div>
              <div className={styles.modeLabel}>{MODE_LABEL[timer.mode]}</div>
            </div>
          </div>

          <div className={styles.side}>
            <div className={styles.sessionLabel}>
              {timer.mode === 'done'
                ? `${settings.blocks} of ${settings.blocks} blocks complete`
                : `Block ${timer.session + 1} of ${settings.blocks}`}
            </div>
            <div className={styles.dots}>
              {Array.from({ length: settings.blocks }, (_, i) => {
                const state =
                  timer.mode === 'done' || i < timer.session
                    ? 'done'
                    : i === timer.session
                      ? timer.mode === 'focus'
                        ? 'current'
                        : 'done'
                      : 'todo'
                return (
                  <span
                    key={i}
                    className={styles.dot}
                    data-state={state}
                    data-running={timer.running}
                  />
                )
              })}
            </div>
            <div className={styles.controls}>
              <button type="button" onClick={back}>
                <span className="material-icons">skip_previous</span>
              </button>
              <button type="button" data-primary="true" onClick={toggle}>
                <span className="material-icons">
                  {timer.mode === 'done'
                    ? 'replay'
                    : timer.running
                      ? 'pause'
                      : 'play_arrow'}
                </span>
              </button>
              <button
                type="button"
                onClick={skip}
                disabled={timer.mode === 'done'}
              >
                <span className="material-icons">skip_next</span>
              </button>
            </div>
            <button type="button" className={styles.reset} onClick={reset}>
              <span className="material-icons">restart_alt</span>
              Reset all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

const Stepper: React.FC<StepperProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}) => (
  <div className={styles.row}>
    <span>{label}</span>
    <div className={styles.stepper}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
      >
        <span className="material-icons">remove</span>
      </button>
      <div className={styles.stepValue}>{value}</div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
      >
        <span className="material-icons">add</span>
      </button>
    </div>
  </div>
)

interface SwatchesProps {
  label: string
  value: string
  onChange: (value: string) => void
}

const Swatches: React.FC<SwatchesProps> = ({ label, value, onChange }) => (
  <div className={styles.row}>
    <span>{label}</span>
    <div className={styles.swatches}>
      {SWATCHES.map(color => (
        <button
          key={color}
          type="button"
          style={{ background: color }}
          data-on={color === value}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  </div>
)

export default PomodoroApp
