var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">list_alt</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Console Logs</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('logs' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('logs' === 'playback') ws.sendType('playback', 'sources')
  else if ('logs' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('logs' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('logs' === 'github') ws.sendType('github', 'overview')
  else if ('logs' === 'link') ws.sendType('link', 'join')
  else if ('logs' === 'mic') ws.sendType('mic', 'watch')
  else if ('logs' === 'layout') ws.sendType('layout')
  else if ('logs' === 'screensaver') ws.sendType('screensaver', 'getAlbum')
  ws.listen(function (msg) {
    if (msg.type !== 'logs' && msg.type !== 'playback' && msg.type !== 'layout' && msg.type !== 'screensaver') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

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
  return '<div class="filters"><button type="button" data-on="' + (filter === 'ALL') + '" onclick="filter=\'ALL\'">All</button><button type="button" data-on="' + (filter === 'WARN') + '" onclick="filter=\'WARN\'">Warnings+</button><button type="button" data-on="' + (filter === 'ERROR') + '" onclick="filter=\'ERROR\'">Errors</button></div>' +
    '<div class="list">' + (shown.length ? shown.map(function (l) { return '<div class="line">' + String(l).replace(/</g, '&lt;') + '</div>' }).join('') : '<div class="empty">No log lines yet</div>') + '</div>'
}

