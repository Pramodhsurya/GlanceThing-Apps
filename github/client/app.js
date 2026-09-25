var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">code</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">GitHub</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('github' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('github' === 'playback') ws.sendType('playback', 'sources')
  else if ('github' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('github' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('github' === 'github') ws.sendType('github', 'overview')
  else if ('github' === 'link') ws.sendType('link', 'join')
  else if ('github' === 'mic') ws.sendType('mic', 'watch')
  else if ('github' === 'layout') ws.sendType('layout')
  else if ('github' === 'screensaver') ws.sendType('screensaver', 'getAlbum')
  ws.listen(function (msg) {
    if (msg.type !== 'github' && msg.type !== 'playback' && msg.type !== 'layout' && msg.type !== 'screensaver') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

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

