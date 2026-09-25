import { useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { useSocketMessage } from './shared.tsx'

import styles from './SystemApp.module.css'

interface SystemInfo {
  hostname: string
  platform: string
  cpuModel: string
  cpu: { overall: number; cores: number[] }
  load: number[]
  memory: { total: number; used: number }
  uptime: number
}

const POLL_MS = 2000
const HISTORY = 30

const PLATFORM_ICON: Record<string, string> = {
  darwin: 'laptop_mac',
  win32: 'laptop_windows',
  linux: 'computer'
}

function formatBytes(bytes: number) {
  const gb = bytes / 1024 ** 3
  return gb >= 10 ? `${gb.toFixed(0)} GB` : `${gb.toFixed(1)} GB`
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

function levelColor(percent: number) {
  if (percent >= 85) return '#f87171'
  if (percent >= 60) return '#fbbf24'
  return '#34d399'
}

const GAUGE = 2 * Math.PI * 52

const Gauge: React.FC<{ label: string; percent: number; detail: string }> = ({
  label,
  percent,
  detail
}) => (
  <div className={styles.gauge}>
    <svg viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="52" className={styles.gaugeTrack} />
      <circle
        cx="60"
        cy="60"
        r="52"
        className={styles.gaugeFill}
        stroke={levelColor(percent)}
        strokeDasharray={GAUGE}
        strokeDashoffset={GAUGE * (1 - percent / 100)}
      />
    </svg>
    <div className={styles.gaugeInner}>
      <div className={styles.gaugeValue}>{percent}%</div>
      <div className={styles.gaugeLabel}>{label}</div>
    </div>
    <div className={styles.gaugeDetail}>{detail}</div>
  </div>
)

const SystemApp: React.FC = () => {
  const { closeApp } = useApps()
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [history, setHistory] = useState<number[]>([])

  const { ready, socket } = useSocketMessage<SystemInfo>('system', data => {
    setInfo(data)
    setHistory(h => [...h, data.cpu.overall].slice(-HISTORY))
  })

  useEffect(() => {
    if (!ready || !socket) return
    const poll = () => socket.send(JSON.stringify({ type: 'system' }))
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [ready, socket])

  const memPercent = info
    ? Math.round((info.memory.used / info.memory.total) * 100)
    : 0

  const points = history
    .map((v, i) => {
      const x = (i / (HISTORY - 1)) * 300
      const y = 80 - (v / 100) * 76
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={closeApp}>
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Resource Usage</div>
        {info ? (
          <div className={styles.host}>
            <span className="material-icons">
              {PLATFORM_ICON[info.platform] ?? 'computer'}
            </span>
            {info.hostname}
          </div>
        ) : null}
      </div>

      {info ? (
        <div className={styles.body}>
          <div className={styles.gauges}>
            <Gauge
              label="CPU"
              percent={info.cpu.overall}
              detail={`${info.cpu.cores.length} cores`}
            />
            <Gauge
              label="RAM"
              percent={memPercent}
              detail={`${formatBytes(info.memory.used)} / ${formatBytes(
                info.memory.total
              )}`}
            />
          </div>

          <div className={styles.details}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>CPU · last minute</div>
              <svg
                viewBox="0 0 300 80"
                preserveAspectRatio="none"
                className={styles.chart}
              >
                <line x1="0" y1="42" x2="300" y2="42" />
                {history.length > 1 ? (
                  <polyline
                    points={points}
                    stroke={levelColor(info.cpu.overall)}
                  />
                ) : null}
              </svg>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Per core</div>
              <div className={styles.cores}>
                {info.cpu.cores.map((value, i) => (
                  <div key={i} className={styles.core}>
                    <div
                      className={styles.coreFill}
                      style={{
                        height: `${Math.max(3, value)}%`,
                        background: levelColor(value)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.stats}>
              <div>
                <small>Load</small>
                {info.load.map(l => l.toFixed(2)).join('  ')}
              </div>
              <div>
                <small>Uptime</small>
                {formatUptime(info.uptime)}
              </div>
            </div>
            <div className={styles.model}>{info.cpuModel}</div>
          </div>
        </div>
      ) : (
        <div className={styles.loading}>
          <span className="material-icons">memory</span>
          <p>Reading system stats…</p>
        </div>
      )}
    </div>
  )
}

export default SystemApp
