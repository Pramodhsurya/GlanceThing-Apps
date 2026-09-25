var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">mic</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Recording Notes</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('recorder' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('recorder' === 'playback') ws.sendType('playback', 'sources')
  else if ('recorder' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('recorder' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('recorder' === 'github') ws.sendType('github', 'overview')
  else if ('recorder' === 'link') ws.sendType('link', 'join')
  ws.listen(function (msg) {
    if (msg.type !== 'recorder' && msg.type !== 'playback') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

var rec = { recording: false, elapsed: 0, list: [], error: null }
window.onAppMessage = function (msg) {
  if (msg.action === 'list') rec.list = msg.data || []
  else if (msg.data && msg.data.kind === 'state') rec.recording = msg.data.recording
  else if (msg.data && msg.data.kind === 'level') rec.elapsed = msg.data.elapsedMs
  else if (msg.data && msg.data.kind === 'error') rec.error = msg.data.message
}
window.renderApp = function () {
  var items = rec.list.map(function (r) {
    return '<div class="item"><button type="button" onclick="window._rec(\'play\',\'' + r.name + '\')">Play</button><div>' + new Date(r.createdAt).toLocaleTimeString() + ' · ' + GT.formatMs(r.durationMs) + '</div></div>'
  }).join('')
  return '<div class="body"><div class="recorder" data-recording="' + rec.recording + '"><div class="elapsed">' + GT.formatMs(rec.recording ? rec.elapsed : 0) + '</div>' +
    '<button type="button" class="record" onclick="window._rec(rec.recording ? \'stop\' : \'start\')"></button>' +
    '<div class="status">' + (rec.error || (rec.recording ? 'Recording' : 'Tap to record')) + '</div></div>' +
    '<div class="list">' + (items || '<div class="empty">No recordings yet</div>') + '</div></div>'
}
window._rec = function (action, name) {
  var ws = window._ws
  if (!ws) return
  ws.sendType('recorder', action, name ? { name: name } : undefined)
}

