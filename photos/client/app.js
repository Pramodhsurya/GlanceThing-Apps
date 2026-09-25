var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">photo_library</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Photos</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('screensaver' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('screensaver' === 'playback') ws.sendType('playback', 'sources')
  else if ('screensaver' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('screensaver' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('screensaver' === 'github') ws.sendType('github', 'overview')
  else if ('screensaver' === 'link') ws.sendType('link', 'join')
  else if ('screensaver' === 'mic') ws.sendType('mic', 'watch')
  else if ('screensaver' === 'layout') ws.sendType('layout')
  else if ('screensaver' === 'screensaver') ws.sendType('screensaver', 'getAlbum')
  ws.listen(function (msg) {
    if (msg.type !== 'screensaver' && msg.type !== 'playback' && msg.type !== 'layout' && msg.type !== 'screensaver') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

window._album = { ids: [], images: {}, index: 0 }
window.onAppMessage = function (msg, ws) {
  if (msg.action === 'album') {
    var photos = (msg.data && msg.data.photos) || []
    window._album.ids = []
    for (var i = 0; i < photos.length; i++) if (photos[i] && photos[i].id) window._album.ids.push(String(photos[i].id))
    window._album.index = 0
    for (var j = 0; j < window._album.ids.length; j++) ws.sendType('screensaver', 'getImage', { id: window._album.ids[j] })
  }
  if (msg.action === 'image' && msg.data && msg.data.id) window._album.images[msg.data.id] = msg.data.image
}
window.renderApp = function () {
  var a = window._album
  if (!a.ids.length) return '<div class="empty"><span class="material-icons">photo_library</span><p>Add photos in Settings → Client.</p></div>'
  var id = a.ids[a.index]
  var img = a.images[id]
  var thumbs = a.ids.map(function (pid, i) {
    return '<button type="button" data-on="' + (i === a.index) + '" onclick="window._album.index=' + i + '">' + (a.images[pid] ? '<img src="' + a.images[pid] + '">' : '') + '</button>'
  }).join('')
  return '<div class="body"><div class="stage">' + (img ? '<img src="' + img + '">' : '<div class="loading">Loading photo…</div>') + '</div><div class="strip">' + thumbs + '</div></div>'
}

