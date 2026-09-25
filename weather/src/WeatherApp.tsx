import { useApps } from '@/contexts/AppsContext.tsx'
import { useLayoutData } from './shared.tsx'
import type { WeatherDay, WeatherInfo } from '../../Widgets/screenModel'

import styles from './WeatherApp.module.css'

function line(value: number | null | undefined, suffix = '°') {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return Math.round(value) + suffix
}

function tone(icon: string) {
  if (icon === 'sunny' || icon === 'wb_sunny' || icon === 'wb_twilight') {
    return 'sun'
  }
  if (icon === 'water_drop' || icon === 'grain') return 'rain'
  return ''
}

function sky(weather?: WeatherInfo) {
  if (weather?.isDay === false) return 'night'
  const icon = weather?.icon || ''
  return icon === 'sunny' || icon === 'wb_sunny' || icon === 'filter_drama'
    ? 'clear'
    : 'cloudy'
}

function weekRange(days: WeatherDay[]) {
  const lows = days
    .map(day => day.low)
    .filter((value): value is number => typeof value === 'number')
  const highs = days
    .map(day => day.high)
    .filter((value): value is number => typeof value === 'number')
  if (lows.length === 0 || highs.length === 0) {
    return { low: 0, high: 1 }
  }
  return { low: Math.min(...lows), high: Math.max(...highs) }
}

const WeatherApp: React.FC = () => {
  const { closeApp } = useApps()
  const layout = useLayoutData<{ weather?: WeatherInfo }>()
  const weather = layout?.weather
  const ready = typeof weather?.temp === 'number'
  const hours = (weather?.hours || []).slice(0, 8)
  const days = (weather?.days || []).slice(0, 10)
  const range = weekRange(days)
  const span = Math.max(range.high - range.low, 1)

  return (
    <div className={styles.shell} data-sky={sky(weather)}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={closeApp}
        >
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Weather</div>
        <div className={styles.place}>
          <span className="material-icons">
            {weather?.query ? 'location_on' : 'near_me'}
          </span>
          {weather?.place || 'Set a city in Layout'}
        </div>
      </div>

      {ready ? (
        <div className={styles.body}>
          <div className={styles.main}>
            <div className={styles.nowCol}>
              <div className={styles.now}>
                <div className={styles.tempBlock}>
                  <strong className={styles.temp}>
                    {Math.round(weather?.temp || 0)}°
                  </strong>
                  <p className={styles.label}>{weather?.label}</p>
                  <p className={styles.range}>
                    H {line(weather?.high)} · L {line(weather?.low)}
                  </p>
                </div>
                <span
                  className={'material-icons ' + styles.icon}
                  data-tone={tone(weather?.icon || '')}
                >
                  {weather?.icon || 'cloud'}
                </span>
              </div>
              <div className={styles.facts}>
                <div>
                  <small>Feels</small>
                  {line(weather?.feels)}
                </div>
                <div>
                  <small>Humidity</small>
                  {typeof weather?.humidity === 'number'
                    ? Math.round(weather.humidity) + '%'
                    : '—'}
                </div>
                <div>
                  <small>Wind</small>
                  {typeof weather?.wind === 'number'
                    ? `${Math.round(weather.wind)} ${weather.windUnit || ''} ${weather.windDir || ''}`.trim()
                    : '—'}
                </div>
                <div>
                  <small>Rain</small>
                  {typeof weather?.rain === 'number'
                    ? Math.round(weather.rain) + '%'
                    : '—'}
                </div>
              </div>
            </div>

            <div className={styles.days}>
              {days.length > 0 ? (
                days.map((day, index) => {
                  const low =
                    typeof day.low === 'number' ? day.low : range.low
                  const high =
                    typeof day.high === 'number' ? day.high : range.high
                  const left = ((low - range.low) / span) * 100
                  const width = Math.max(((high - low) / span) * 100, 8)
                  const current =
                    index === 0 && typeof weather?.temp === 'number'
                      ? ((weather.temp - range.low) / span) * 100
                      : null
                  return (
                    <div className={styles.day} key={day.date || index}>
                      <span className={styles.dayName}>
                        {day.day || '—'}
                      </span>
                      <span
                        className={'material-icons ' + styles.dayIcon}
                        data-tone={tone(day.icon || '')}
                      >
                        {day.icon || 'cloud'}
                      </span>
                      <span
                        className={styles.dayRain}
                        data-on={
                          typeof day.rain === 'number' && day.rain > 0
                            ? 'true'
                            : 'false'
                        }
                      >
                        {typeof day.rain === 'number' && day.rain > 0
                          ? Math.round(day.rain) + '%'
                          : ''}
                      </span>
                      <strong className={styles.dayLow}>
                        {line(day.low)}
                      </strong>
                      <div className={styles.dayTrack}>
                        <div
                          className={styles.dayBar}
                          style={{
                            left: left + '%',
                            width: width + '%'
                          }}
                        />
                        {current != null ? (
                          <span
                            className={styles.nowDot}
                            style={{ left: current + '%' }}
                          />
                        ) : null}
                      </div>
                      <strong className={styles.dayHigh}>
                        {line(day.high)}
                      </strong>
                    </div>
                  )
                })
              ) : (
                <div className={styles.daysEmpty}>
                  10-day forecast is loading…
                </div>
              )}
            </div>
          </div>

          {hours.length > 0 ? (
            <div className={styles.hours}>
              {hours.map((hour, index) => (
                <div className={styles.hour} key={index + hour.time}>
                  <span>{hour.time}</span>
                  <span
                    className={'material-icons ' + styles.hourIcon}
                    data-tone={tone(hour.icon)}
                  >
                    {hour.icon}
                  </span>
                  <strong>{line(hour.temp)}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className="material-icons">wb_sunny</span>
          <p>{weather?.message || 'Add a city in the Layout tab.'}</p>
        </div>
      )}
    </div>
  )
}

export default WeatherApp
