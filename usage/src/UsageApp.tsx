import { useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { macNow } from '@/lib/macClock.ts'
import { UsageFace } from '../../Widgets/Screen.tsx'
import type { AiUsageInfo, UsageTarget } from '../../Widgets/screenModel'
import { useLayoutData } from './shared.tsx'

import styles from './UsageApp.module.css'

const PROVIDERS: UsageTarget[] = ['codex', 'claude', 'cursor']

const UsageApp: React.FC = () => {
  const { closeApp } = useApps()
  const layout = useLayoutData<{ aiUsage?: AiUsageInfo }>()
  const [now, setNow] = useState(0)
  const [view, setView] = useState<'details' | 'overview'>('details')

  useEffect(() => {
    const tick = () => setNow(macNow())
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])

  const usage = layout?.aiUsage
  const connected = (usage?.providers || []).filter(
    provider => (provider.windows || []).length > 0
  ).length

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
        <div className={styles.title}>AI usage</div>
        <div className={styles.tabs}>
          <button
            type="button"
            data-on={view === 'details'}
            onClick={() => setView('details')}
          >
            Limits
          </button>
          <button
            type="button"
            data-on={view === 'overview'}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
        </div>
        <div className={styles.meta}>
          {usage
            ? `${connected} of ${(usage.providers || []).length} connected`
            : 'Loading…'}
        </div>
      </div>
      <div className={styles.body} data-view={view}>
        {view === 'overview' ? (
          <UsageFace
            usage={usage || undefined}
            usageStyle="tinted"
            now={now}
          />
        ) : (
          <div className={styles.columns}>
            {PROVIDERS.map(target => (
              <div className={styles.column} key={target}>
                <UsageFace
                  usage={usage || undefined}
                  target={target}
                  compact
                  now={now}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UsageApp
