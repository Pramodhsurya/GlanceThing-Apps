import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcCss = path.join(
  '/Users/prjr0001/Documents/project/carthing/glancething/desktop/client/src/components/AppHost/apps'
)

const APPS = [
  {
    id: 'music',
    label: 'Music',
    icon: 'music_note',
    color: '#a855f7',
    description:
      'Now playing with seek, skip 10 seconds, shuffle, repeat and volume.',
    credit:
      'Inspired by DeskThing-GMP and DeskThing Local Audio. GlanceThing-native source.',
    css: 'MusicApp.module.css',
    builtin: true
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    icon: 'timer',
    color: '#ef4444',
    description: 'Focus timer with short and long breaks.',
    credit:
      'Inspired by grahamplace/pomodoro-thing. GlanceThing-native source.',
    css: 'PomodoroApp.module.css',
    builtin: true
  },
  {
    id: 'system',
    label: 'Resource Usage',
    icon: 'memory',
    color: '#10b981',
    description: 'CPU, memory and uptime of this computer.',
    credit:
      'Inspired by ItsRiprod/Deskthing-Apps system. GlanceThing-native source.',
    css: 'SystemApp.module.css',
    builtin: true
  },
  {
    id: 'recorder',
    label: 'Recording Notes',
    icon: 'mic',
    color: '#f43f5e',
    description: "Record voice notes with the Car Thing's microphone.",
    credit:
      'Inspired by ItsRiprod/Deskthing-Apps recorder. GlanceThing-native source.',
    css: 'RecorderApp.module.css',
    builtin: true
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: 'code',
    color: '#238636',
    description: 'Your repos, stars, pull requests and issues.',
    credit:
      'Inspired by dakota-kallas/DeskThing-GitHub. GlanceThing-native source.',
    css: 'GitHubApp.module.css',
    builtin: true
  },
  {
    id: 'logs',
    label: 'Console Logs',
    icon: 'list_alt',
    color: '#0ea5e9',
    description: 'Live GlanceThing logs.',
    credit:
      'Inspired by ItsRiprod/Deskthing-Apps logs. GlanceThing-native source.',
    css: 'LogsApp.module.css',
    builtin: true
  },
  {
    id: 'link',
    label: 'Link',
    icon: 'link',
    color: '#6366f1',
    description: 'Shared tap board between connected Car Things.',
    credit: 'Inspired by ItsRiprod/Deskthing-Apps link. GlanceThing-native source.',
    css: 'LinkApp.module.css',
    builtin: true
  },
  {
    id: 'exampleapp',
    label: 'Example App',
    icon: 'widgets',
    color: '#f59e0b',
    description: 'A template you can copy to make a new GlanceThing app.',
    credit: 'Official GlanceThing template.',
    css: null,
    builtin: false
  }
]

function chrome69Css(css) {
  return css
    .replace(/\binset:\s*0;/g, 'top: 0; right: 0; bottom: 0; left: 0;')
    .replace(/\bgap:\s*([^;]+);/g, function (_, value) {
      return '/* gap replaced for Chrome 69 */ margin: 0; --gap: ' + value + ';'
    })
}

function html(app) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=800, height=480, user-scalable=no" />
    <title>${app.label}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    <link rel="stylesheet" href="base.css" />
    <link rel="stylesheet" href="app.css" />
  </head>
  <body>
    <div id="root" class="shell"></div>
    <script src="gt.js"></script>
    <script src="app.js"></script>
  </body>
</html>
`
}

function manifest(app) {
  return {
    id: app.id,
    label: app.label,
    version: '1.0.0',
    author: 'GlanceThing',
    description: app.description,
    repository: 'https://github.com/Pramodhsurya/GlanceThing-Apps',
    icon: app.icon,
    color: app.color,
    platforms: ['mac', 'windows', 'linux'],
    requiredVersions: { server: '1.0.0' }
  }
}

function readme(app) {
  return `# ${app.label}

${app.description}

${app.builtin ? `This app ships **built into GlanceThing** as \`${app.id}\`. Installing this zip warns **Reserved App ID**.` : 'Copy this folder to start a new community app. Change `id` in `manifest.json` before you publish.'}

${app.credit}

## Layout

\`\`\`
${app.id}/
├── manifest.json
├── src/                 # GlanceThing React source (reference)
└── client/              # Packaged web UI GlanceThing serves
    ├── index.html
    ├── app.js
    └── app.css
\`\`\`

## Install

GlanceThing → **Apps** → **Add App** → \`Pramodhsurya/GlanceThing-Apps\`, or upload \`${app.id}-app-v1.0.0.zip\`.
`
}

function pkg(app) {
  return {
    name: `@glancething/${app.id}`,
    private: true,
    version: '1.0.0',
    description: app.description
  }
}

const JS = {
  exampleapp: `var root = document.getElementById('root')
root.innerHTML =
  '<div class="header"><div class="title">Example App</div></div>' +
  '<div class="body">' +
  '<p>This is a GlanceThing community app.</p>' +
  '<p>Edit <code>client/index.html</code>, <code>app.js</code> and <code>app.css</code>.</p>' +
  '<p>The Car Thing screen is 800×480 and the browser is Chrome 69.</p>' +
  '</div>'
`,
  pomodoro: `var DEFAULTS = { blocks: 4, focusMin: 25, shortMin: 5, longMin: 20, focusColor: '#f87171', breakColor: '#34d399', flash: true }
var SWATCHES = ['#f87171', '#fb923c', '#facc15', '#34d399', '#22d3ee', '#818cf8', '#e879f9']
var RING = 2 * Math.PI * 88
var settings = load('gt.pomodoro.settings', DEFAULTS)
var timer = load('gt.pomodoro.timer', fresh(DEFAULTS))
var now = Date.now()
var flashKey = 0
var showSettings = false

function load(key, fallback) {
  try {
    var raw = localStorage.getItem(key)
    return raw ? Object.assign({}, fallback, JSON.parse(raw)) : fallback
  } catch (e) { return fallback }
}
function save() {
  localStorage.setItem('gt.pomodoro.settings', JSON.stringify(settings))
  localStorage.setItem('gt.pomodoro.timer', JSON.stringify(timer))
}
function duration(mode, s) {
  if (mode === 'focus') return s.focusMin * 60000
  if (mode === 'short') return s.shortMin * 60000
  if (mode === 'long') return s.longMin * 60000
  return 0
}
function fresh(s) {
  return { mode: 'focus', session: 0, running: false, endAt: 0, remainingMs: duration('focus', s) }
}
function nextPhase(t, s) {
  if (t.mode === 'focus') return { mode: t.session >= s.blocks - 1 ? 'long' : 'short', session: t.session }
  if (t.mode === 'short') return { mode: 'focus', session: t.session + 1 }
  return { mode: 'done', session: t.session }
}
function prevPhase(t, s) {
  if (t.mode === 'done') return { mode: 'long', session: s.blocks - 1 }
  if (t.mode === 'short' || t.mode === 'long') return { mode: 'focus', session: t.session }
  if (t.session === 0) return { mode: 'focus', session: 0 }
  return { mode: 'short', session: t.session - 1 }
}
function enter(phase, s, running, from) {
  from = from || Date.now()
  var dur = duration(phase.mode, s)
  var keep = running && phase.mode !== 'done'
  return { mode: phase.mode, session: phase.session, running: keep, endAt: keep ? from + dur : 0, remainingMs: dur }
}
function remainingOf(t, tnow) { return t.running ? Math.max(0, t.endAt - tnow) : t.remainingMs }
function catchUp(t, s, tnow) {
  var advanced = false
  while (t.running && t.endAt <= tnow) {
    t = enter(nextPhase(t, s), s, true, t.endAt)
    advanced = true
  }
  return { timer: t, advanced: advanced }
}
function pad(n) { return (n < 10 ? '0' : '') + n }
function formatTime(ms) {
  var total = Math.ceil(ms / 1000)
  return pad(Math.floor(total / 60)) + ':' + pad(total % 60)
}

function render() {
  var remaining = remainingOf(timer, now)
  var total = duration(timer.mode, settings) || 1
  var progress = timer.mode === 'done' ? 1 : 1 - remaining / total
  var isBreak = timer.mode === 'short' || timer.mode === 'long'
  var accent = isBreak ? settings.breakColor : settings.focusColor
  var root = document.getElementById('root')
  root.style.setProperty('--accent', accent)
  var labels = { focus: 'Focus', short: 'Short break', long: 'Long break', done: 'All done' }
  var icons = { focus: 'psychology', short: 'local_cafe', long: 'self_improvement', done: 'celebration' }
  var dots = ''
  for (var i = 0; i < settings.blocks; i++) {
    var state = timer.mode === 'done' || i < timer.session ? 'done' : i === timer.session ? (timer.mode === 'focus' ? 'current' : 'done') : 'todo'
    dots += '<span class="dot" data-state="' + state + '" data-running="' + timer.running + '"></span>'
  }
  if (showSettings) {
    root.innerHTML = header() + '<div class="settings">' +
      stepper('Focus blocks', 'blocks', settings.blocks, 1, 10, 1) +
      stepper('Focus (min)', 'focusMin', settings.focusMin, 1, 90, 5) +
      stepper('Short break (min)', 'shortMin', settings.shortMin, 1, 30, 1) +
      stepper('Long break (min)', 'longMin', settings.longMin, 1, 60, 5) +
      swatches('Focus colour', 'focusColor', settings.focusColor) +
      swatches('Break colour', 'breakColor', settings.breakColor) +
      '<div class="row"><span>Flash screen when a phase ends</span><button type="button" class="toggle" data-on="' + settings.flash + '" data-act="flash"><span></span></button></div></div>'
  } else {
    root.innerHTML = (flashKey ? '<div class="flash"></div>' : '') + header() +
      '<div class="body"><div class="ringWrap"><svg viewBox="0 0 200 200" class="ring"><circle cx="100" cy="100" r="88" class="track"/><circle cx="100" cy="100" r="88" class="fill" stroke-dasharray="' + RING + '" stroke-dashoffset="' + (RING * (1 - progress)) + '"/></svg>' +
      '<div class="ringInner"><span class="material-icons">' + icons[timer.mode] + '</span><div class="clock">' + (timer.mode === 'done' ? '🎉' : formatTime(remaining)) + '</div><div class="modeLabel">' + labels[timer.mode] + '</div></div></div>' +
      '<div class="side"><div class="sessionLabel">' + (timer.mode === 'done' ? settings.blocks + ' of ' + settings.blocks + ' blocks complete' : 'Block ' + (timer.session + 1) + ' of ' + settings.blocks) + '</div>' +
      '<div class="dots">' + dots + '</div><div class="controls">' +
      '<button type="button" data-act="back"><span class="material-icons">skip_previous</span></button>' +
      '<button type="button" data-primary="true" data-act="toggle"><span class="material-icons">' + (timer.mode === 'done' ? 'replay' : timer.running ? 'pause' : 'play_arrow') + '</span></button>' +
      '<button type="button" data-act="skip"' + (timer.mode === 'done' ? ' disabled' : '') + '><span class="material-icons">skip_next</span></button></div>' +
      '<button type="button" class="reset" data-act="reset"><span class="material-icons">restart_alt</span> Reset all</button></div></div>'
  }
  function header() {
    return '<div class="header"><div class="title">Pomodoro</div><button type="button" class="iconBtn" data-act="settings" data-active="' + showSettings + '"><span class="material-icons">' + (showSettings ? 'close' : 'tune') + '</span></button></div>'
  }
  function stepper(label, key, value, min, max, step) {
    return '<div class="row"><span>' + label + '</span><div class="stepper"><button type="button" data-step="' + key + '" data-dir="-1" data-min="' + min + '" data-max="' + max + '" data-stepn="' + step + '"' + (value <= min ? ' disabled' : '') + '><span class="material-icons">remove</span></button><div class="stepValue">' + value + '</div><button type="button" data-step="' + key + '" data-dir="1" data-min="' + min + '" data-max="' + max + '" data-stepn="' + step + '"' + (value >= max ? ' disabled' : '') + '><span class="material-icons">add</span></button></div></div>'
  }
  function swatches(label, key, value) {
    return '<div class="row"><span>' + label + '</span><div class="swatches">' + SWATCHES.map(function (c) {
      return '<button type="button" data-color-key="' + key + '" data-color="' + c + '" style="background:' + c + '" data-on="' + (c === value) + '"></button>'
    }).join('') + '</div></div>'
  }
}

document.getElementById('root').addEventListener('click', function (e) {
  var btn = e.target.closest('button')
  if (!btn) return
  var t = Date.now()
  if (btn.getAttribute('data-act') === 'settings') showSettings = !showSettings
  if (btn.getAttribute('data-act') === 'toggle') {
    if (timer.mode === 'done') timer = enter({ mode: 'focus', session: 0 }, settings, true, t)
    else if (timer.running) timer = { mode: timer.mode, session: timer.session, running: false, endAt: 0, remainingMs: remainingOf(timer, t) }
    else timer = { mode: timer.mode, session: timer.session, running: true, endAt: t + timer.remainingMs, remainingMs: timer.remainingMs }
  }
  if (btn.getAttribute('data-act') === 'skip') timer = enter(nextPhase(timer, settings), settings, timer.running)
  if (btn.getAttribute('data-act') === 'back') {
    var rem = remainingOf(timer, t)
    var tot = duration(timer.mode, settings) || 1
    var restartOnly = tot - rem > 3000 || (timer.mode === 'focus' && timer.session === 0)
    timer = enter(restartOnly ? { mode: timer.mode, session: timer.session } : prevPhase(timer, settings), settings, timer.running)
  }
  if (btn.getAttribute('data-act') === 'reset') timer = fresh(settings)
  if (btn.getAttribute('data-act') === 'flash') settings.flash = !settings.flash
  if (btn.getAttribute('data-step')) {
    var key = btn.getAttribute('data-step')
    var next = settings[key] + Number(btn.getAttribute('data-dir')) * Number(btn.getAttribute('data-stepn'))
    settings[key] = Math.max(Number(btn.getAttribute('data-min')), Math.min(Number(btn.getAttribute('data-max')), next))
    if (!timer.running) timer = enter({ mode: timer.mode, session: Math.min(timer.session, settings.blocks - 1) }, settings, false)
  }
  if (btn.getAttribute('data-color')) {
    settings[btn.getAttribute('data-color-key')] = btn.getAttribute('data-color')
  }
  save()
  render()
})

setInterval(function () {
  now = Date.now()
  var caught = catchUp(timer, settings, now)
  if (caught.advanced) {
    timer = caught.timer
    if (settings.flash) flashKey += 1
    save()
  }
  if (!showSettings) render()
}, 250)
render()
`,
  music: wsApp('music', 'Music', 'playback'),
  system: wsApp('system', 'Resource Usage', 'system'),
  recorder: wsApp('recorder', 'Recording Notes', 'recorder'),
  github: wsApp('github', 'GitHub', 'github'),
  logs: wsApp('logs', 'Console Logs', 'logs'),
  link: wsApp('link', 'Link', 'link')
}

function wsApp(id, title, type) {
  return `var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">${APPS.find(a => a.id === id).icon}</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">${title}</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('${type}' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('${type}' === 'playback') ws.sendType('playback', 'sources')
  else if ('${type}' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('${type}' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('${type}' === 'github') ws.sendType('github', 'overview')
  else if ('${type}' === 'link') ws.sendType('link', 'join')
  ws.listen(function (msg) {
    if (msg.type !== '${type}' && msg.type !== 'playback') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()
${uiExtra(id)}
`
}

function uiExtra(id) {
  if (id === 'system') {
    return `
window.renderApp = function (state) {
  var info = state.data
  if (!info || !info.cpu) return '<div class="loading"><span class="material-icons">memory</span><p>Reading system stats…</p></div>'
  var mem = Math.round((info.memory.used / info.memory.total) * 100)
  function gb(n) { var v = n / 1073741824; return (v >= 10 ? v.toFixed(0) : v.toFixed(1)) + ' GB' }
  function up(s) {
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'
  }
  var cores = (info.cpu.cores || []).map(function (v) {
    return '<div class="core"><div class="coreFill" style="height:' + Math.max(3, v) + '%"></div></div>'
  }).join('')
  return '<div class="body"><div class="gauges"><div class="gauge"><div class="gaugeValue">' + info.cpu.overall + '%</div><div class="gaugeLabel">CPU</div><div class="gaugeDetail">' + info.cpu.cores.length + ' cores</div></div>' +
    '<div class="gauge"><div class="gaugeValue">' + mem + '%</div><div class="gaugeLabel">RAM</div><div class="gaugeDetail">' + gb(info.memory.used) + ' / ' + gb(info.memory.total) + '</div></div></div>' +
    '<div class="details"><div class="card"><div class="cardLabel">Host</div><div>' + (info.hostname || '') + '</div><div class="model">' + (info.cpuModel || '') + '</div></div>' +
    '<div class="card"><div class="cardLabel">Per core</div><div class="cores">' + cores + '</div></div>' +
    '<div class="stats"><div><small>Load</small>' + (info.load || []).map(function (l) { return l.toFixed(2) }).join('  ') + '</div><div><small>Uptime</small>' + up(info.uptime) + '</div></div></div></div>'
}
`
  }
  if (id === 'logs') {
    return `
var lines = []
var filter = 'ALL'
window.onAppMessage = function (msg) {
  if (msg.action === 'history' && msg.data && msg.data.length) lines = msg.data.slice(-500)
  else if (msg.action === 'line') lines = lines.concat([msg.data]).slice(-500)
}
window.renderApp = function () {
  var shown = lines.filter(function (raw) {
    if (filter === 'ALL') return true
    return String(raw).indexOf(filter) !== -1
  })
  return '<div class="filters"><button type="button" data-on="' + (filter === 'ALL') + '" onclick="filter=\\'ALL\\'">All</button><button type="button" data-on="' + (filter === 'WARN') + '" onclick="filter=\\'WARN\\'">Warnings+</button><button type="button" data-on="' + (filter === 'ERROR') + '" onclick="filter=\\'ERROR\\'">Errors</button></div>' +
    '<div class="list">' + (shown.length ? shown.map(function (l) { return '<div class="line">' + String(l).replace(/</g, '&lt;') + '</div>' }).join('') : '<div class="empty">No log lines yet</div>') + '</div>'
}
`
  }
  if (id === 'link') {
    return `
window.renderApp = function (state) {
  var data = state.data || { clients: [] }
  var clients = data.clients || []
  var me = null
  for (var i = 0; i < clients.length; i++) if (clients[i].id === data.you) me = clients[i]
  var rows = clients.slice().sort(function (a, b) { return b.score - a.score }).map(function (c, i) {
    return '<div class="row" data-me="' + (c.id === data.you) + '"><div class="rank">' + (i + 1) + '</div><div class="rowMain"><div class="rowTop"><span>' + c.name + (c.id === data.you ? ' (you)' : '') + '</span><strong>' + c.score + '</strong></div></div></div>'
  }).join('')
  return '<div class="body"><button type="button" class="pad" style="background:' + ((me && me.color) || '#333') + '" onclick="window._tap()"><div class="padScore">' + ((me && me.score) || 0) + '</div><div class="padHint">' + (me ? 'Tap!' : 'Joining…') + '</div></button><div class="board">' + (rows || '<div class="hint">Open Link on another screen.</div>') + '</div></div>'
}
window._ws = null
GT.connect(function (ws) { window._ws = ws })
window._tap = function () { if (window._ws) window._ws.sendType('link', 'tap', { inc: 1 }) }
`
  }
  if (id === 'recorder') {
    return `
var rec = { recording: false, elapsed: 0, list: [], error: null }
window.onAppMessage = function (msg) {
  if (msg.action === 'list') rec.list = msg.data || []
  else if (msg.data && msg.data.kind === 'state') rec.recording = msg.data.recording
  else if (msg.data && msg.data.kind === 'level') rec.elapsed = msg.data.elapsedMs
  else if (msg.data && msg.data.kind === 'error') rec.error = msg.data.message
}
window.renderApp = function () {
  var items = rec.list.map(function (r) {
    return '<div class="item"><button type="button" onclick="window._rec(\\'play\\',\\'' + r.name + '\\')">Play</button><div>' + new Date(r.createdAt).toLocaleTimeString() + ' · ' + GT.formatMs(r.durationMs) + '</div></div>'
  }).join('')
  return '<div class="body"><div class="recorder" data-recording="' + rec.recording + '"><div class="elapsed">' + GT.formatMs(rec.recording ? rec.elapsed : 0) + '</div>' +
    '<button type="button" class="record" onclick="window._rec(rec.recording ? \\'stop\\' : \\'start\\')"></button>' +
    '<div class="status">' + (rec.error || (rec.recording ? 'Recording' : 'Tap to record')) + '</div></div>' +
    '<div class="list">' + (items || '<div class="empty">No recordings yet</div>') + '</div></div>'
}
window._rec = function (action, name) {
  var ws = window._ws
  if (!ws) return
  ws.sendType('recorder', action, name ? { name: name } : undefined)
}
`
  }
  if (id === 'github') {
    return `
window.renderApp = function (state) {
  if (state.action === 'error') return '<div class="message"><span class="material-icons">vpn_key</span><p>' + ((state.data && state.data.error) || 'GitHub error') + '</p></div>'
  var overview = state.action === 'overview' ? state.data : window._overview
  if (state.action === 'overview') window._overview = overview
  if (!overview) return '<div class="message"><span class="material-icons">hourglass_empty</span><p>Loading GitHub…</p></div>'
  var repos = (overview.repos || []).map(function (r) {
    return '<div class="repo"><strong>' + r.name + '</strong><div class="repoDesc">' + (r.description || '') + '</div><div class="repoStats">★ ' + r.stars + ' · ' + (r.language || '') + '</div></div>'
  }).join('')
  return '<div class="body"><div class="titleBlock"><small>@' + overview.user.login + '</small></div><div class="list">' + (repos || '<div class="empty">Nothing here yet</div>') + '</div></div>'
}
`
  }
  if (id === 'music') {
    return `
window._playback = null
window._sources = null
window.onAppMessage = function (msg) {
  if (msg.type === 'playback' && msg.action === 'sources') window._sources = msg.data
  if (msg.type === 'playback' && !msg.action) window._playback = msg.data
}
window.renderApp = function () {
  var p = window._playback
  var info = window._sources
  if (!p || !p.track) {
    return '<div class="empty"><span class="material-icons">disc_full</span><p>Nothing is playing</p><small>Play something on your computer, or pick a source in the built-in Music app.</small></div>'
  }
  return '<div class="body"><div class="meta"><div class="trackName">' + (p.track.name || '') + '</div><div class="artist">' + ((p.track.artists || []).join(', ')) + '</div></div>' +
    '<div class="transport">' +
    '<button type="button" onclick="window._play(\\'previous\\')">⏮</button>' +
    '<button type="button" data-primary="true" onclick="window._play(\\'playPause\\')">' + (p.isPlaying ? '⏸' : '▶') + '</button>' +
    '<button type="button" onclick="window._play(\\'next\\')">⏭</button></div>' +
    (info ? '<div class="hint">Source: ' + (info.current || 'none') + '</div>' : '') + '</div>'
}
`
  }
  return ''
}

const exampleCss = `.body {
  padding: 32px;
  font-size: 20px;
  line-height: 1.5;
}
.body code {
  color: #f59e0b;
}
`

for (const app of APPS) {
  const dir = path.join(root, app.id)
  fs.mkdirSync(path.join(dir, 'client'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'manifest.json'),
    JSON.stringify(manifest(app), null, 2) + '\n'
  )
  fs.writeFileSync(path.join(dir, 'README.md'), readme(app))
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(pkg(app), null, 2) + '\n'
  )
  fs.writeFileSync(path.join(dir, 'client', 'index.html'), html(app))
  fs.writeFileSync(path.join(dir, 'client', 'app.js'), JS[app.id])
  if (app.css && fs.existsSync(path.join(srcCss, app.css))) {
    fs.writeFileSync(
      path.join(dir, 'client', 'app.css'),
      chrome69Css(fs.readFileSync(path.join(srcCss, app.css), 'utf8'))
    )
  } else {
    fs.writeFileSync(path.join(dir, 'client', 'app.css'), exampleCss)
  }
  fs.writeFileSync(
    path.join(dir, 'src', 'README.md'),
    app.builtin
      ? `GlanceThing React source for ${app.label}. The Car Thing built-in app loads this from the GlanceThing client, not from this folder.\n`
      : `Add your source here. The packaged UI that GlanceThing serves is \`../client\`.\n`
  )
}

fs.writeFileSync(
  path.join(root, 'exampleapp', 'src', 'index.html'),
  html(APPS.find(a => a.id === 'exampleapp'))
)

console.log('generated', APPS.length, 'apps')
