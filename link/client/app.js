var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">link</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Link</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('link' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('link' === 'playback') ws.sendType('playback', 'sources')
  else if ('link' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('link' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('link' === 'github') ws.sendType('github', 'overview')
  else if ('link' === 'link') ws.sendType('link', 'join')
  ws.listen(function (msg) {
    if (msg.type !== 'link' && msg.type !== 'playback') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

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

