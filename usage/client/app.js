var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">data_usage</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">AI usage</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('layout' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('layout' === 'playback') ws.sendType('playback', 'sources')
  else if ('layout' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('layout' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('layout' === 'github') ws.sendType('github', 'overview')
  else if ('layout' === 'link') ws.sendType('link', 'join')
  else if ('layout' === 'mic') ws.sendType('mic', 'watch')
  else if ('layout' === 'layout') ws.sendType('layout')
  else if ('layout' === 'screensaver') ws.sendType('screensaver', 'getAlbum')
  ws.listen(function (msg) {
    if (msg.type !== 'layout' && msg.type !== 'playback' && msg.type !== 'layout' && msg.type !== 'screensaver') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

window.renderApp = function (state) {
  var usage = state.data && state.data.aiUsage
  var providers = (usage && usage.providers) || []
  if (!providers.length) {
    return '<div class="empty"><span class="material-icons">data_usage</span><p>AI usage has not loaded yet.</p></div>'
  }
  var cards = providers.map(function (p) {
    var windows = p.windows || []
    var left = windows[0] ? Math.round(windows[0].left) : 0
    var cost = p.cost
    var spend = cost ? ' · $' + (cost.today || 0).toFixed(2) + ' today' : ''
    return '<div class="card"><div class="cardLabel">' + p.name + '</div><div class="gaugeValue">' + left + '%</div><div class="hint">' + (windows[0] ? windows[0].label : (p.message || '')) + spend + '</div></div>'
  }).join('')
  return '<div class="body">' + cards + '</div>'
}

