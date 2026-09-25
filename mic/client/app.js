var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">mic</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Mic</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('mic' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('mic' === 'playback') ws.sendType('playback', 'sources')
  else if ('mic' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('mic' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('mic' === 'github') ws.sendType('github', 'overview')
  else if ('mic' === 'link') ws.sendType('link', 'join')
  else if ('mic' === 'mic') ws.sendType('mic', 'watch')
  else if ('mic' === 'layout') ws.sendType('layout')
  else if ('mic' === 'screensaver') ws.sendType('screensaver', 'getAlbum')
  ws.listen(function (msg) {
    if (msg.type !== 'mic' && msg.type !== 'playback' && msg.type !== 'layout' && msg.type !== 'screensaver') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

window._mic = { muted: false, devices: [] }
window.onAppMessage = function (msg) {
  if (msg.action === 'state' && msg.data) window._mic = msg.data
}
window.renderApp = function () {
  var m = window._mic
  return '<div class="body"><button type="button" class="record" onclick="window._micToggle()"><span class="material-icons">' + (m.muted ? 'mic_off' : 'mic') + '</span></button><div class="status">' + (m.muted ? 'Muted' : 'Live') + '</div></div>'
}
window._micToggle = function () {
  if (window._ws) window._ws.sendType('mic', 'toggle')
}
GT.connect(function (ws) { window._ws = ws })

