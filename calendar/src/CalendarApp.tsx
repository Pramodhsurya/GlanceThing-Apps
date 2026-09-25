import { useContext, useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { SocketContext } from '@/contexts/SocketContext.tsx'
import { macNow } from '@/lib/macClock.ts'
import { CalendarFace } from '../../Widgets/Screen.tsx'
import type {
  CalendarEvent,
  CalendarInfo
} from '../../Widgets/screenModel'
import { useLayoutData } from './shared.tsx'

import styles from './CalendarApp.module.css'

const SOURCES = [
  { id: 'teams', label: 'Teams', icon: 'groups' },
  { id: 'mac', label: 'Mac', icon: 'laptop_mac' },
  { id: 'slack', label: 'Slack', icon: 'tag' },
  { id: 'google', label: 'Google Calendar', icon: 'event' }
] as const

type CalendarSource = (typeof SOURCES)[number]['id']

const SOURCE_LABEL: Record<string, string> = {
  teams: 'Teams',
  mac: 'Mac Calendar',
  slack: 'Slack',
  google: 'Google Calendar'
}

const CalendarApp: React.FC = () => {
  const { closeApp } = useApps()
  const { socket } = useContext(SocketContext)
  const layout = useLayoutData<{ calendar?: CalendarInfo }>()
  const [now, setNow] = useState(0)
  const [importing, setImporting] = useState<CalendarSource | null>(null)
  const calendar = layout?.calendar

  useEffect(() => {
    const tick = () => setNow(macNow())
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (importing && calendar?.source === importing) setImporting(null)
  }, [calendar?.source, importing])

  useEffect(() => {
    if (!importing) return
    const id = setTimeout(() => setImporting(null), 20000)
    return () => clearTimeout(id)
  }, [importing])

  function join(event: CalendarEvent) {
    socket?.send(
      JSON.stringify({
        type: 'calendar',
        action: 'join',
        data: { title: event.title, start: event.start }
      })
    )
  }

  function importFrom(source: CalendarSource) {
    setImporting(source)
    socket?.send(
      JSON.stringify({
        type: 'calendar',
        action: 'import',
        data: { source }
      })
    )
  }

  const active = calendar?.source
  const events = calendar?.events || []

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
        <div className={styles.title}>Calendar</div>
        <div className={styles.meta}>
          {importing
            ? `Importing ${SOURCE_LABEL[importing]}…`
            : active
              ? SOURCE_LABEL[active] || active
              : 'Pick a source'}
        </div>
      </div>

      <div className={styles.sources}>
        {SOURCES.map(source => (
          <button
            key={source.id}
            type="button"
            className={styles.source}
            data-active={active === source.id}
            disabled={importing !== null}
            onClick={() => importFrom(source.id)}
          >
            <span className="material-icons">{source.icon}</span>
            {source.label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {events.length > 0 ? (
          <CalendarFace calendar={calendar} now={now} onJoin={join} />
        ) : (
          <div className={styles.empty}>
            <span className="material-icons">calendar_today</span>
            <p>
              {calendar?.message ||
                'Import from Teams, Mac, Slack, or Google Calendar.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarApp
