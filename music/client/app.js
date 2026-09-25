var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">music_note</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Music</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('playback' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('playback' === 'playback') ws.sendType('playback', 'sources')
  else if ('playback' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('playback' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('playback' === 'github') ws.sendType('github', 'overview')
  else if ('playback' === 'link') ws.sendType('link', 'join')
  ws.listen(function (msg) {
    if (msg.type !== 'playback' && msg.type !== 'playback') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

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
    '<button type="button" onclick="window._play(\'previous\')">⏮</button>' +
    '<button type="button" data-primary="true" onclick="window._play(\'playPause\')">' + (p.isPlaying ? '⏸' : '▶') + '</button>' +
    '<button type="button" onclick="window._play(\'next\')">⏭</button></div>' +
    (info ? '<div class="hint">Source: ' + (info.current || 'none') + '</div>' : '') + '</div>'
}

