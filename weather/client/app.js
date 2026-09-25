var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">wb_sunny</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Weather</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
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
  var w = state.data && state.data.weather
  if (!w || typeof w.temp !== 'number') {
    return '<div class="empty"><span class="material-icons">wb_sunny</span><p>' + ((w && w.message) || 'Add a city in the Layout tab.') + '</p></div>'
  }
  var hours = (w.hours || []).slice(0, 6).map(function (h) {
    return '<div class="hour"><span>' + h.time + '</span><span class="material-icons">' + (h.icon || 'cloud') + '</span><strong>' + Math.round(h.temp) + '°</strong></div>'
  }).join('')
  var days = (w.days || []).slice(0, 10).map(function (d) {
    return '<div class="day"><span>' + (d.day || '') + '</span><span class="material-icons">' + (d.icon || 'cloud') + '</span><strong>' + (d.low != null ? Math.round(d.low) : '—') + '° / ' + (d.high != null ? Math.round(d.high) : '—') + '°</strong></div>'
  }).join('')
  return '<div class="body"><div class="now"><div><strong class="temp">' + Math.round(w.temp) + '°</strong><p>' + (w.label || '') + '</p><p>H ' + (w.high != null ? Math.round(w.high) + '°' : '—') + ' · L ' + (w.low != null ? Math.round(w.low) + '°' : '—') + '</p></div><span class="material-icons">' + (w.icon || 'cloud') + '</span></div>' +
    (hours ? '<div class="hours">' + hours + '</div>' : '') +
    (days ? '<div class="days">' + days + '</div>' : '') +
    '<div class="facts"><div><small>Feels</small>' + (w.feels != null ? Math.round(w.feels) + '°' : '—') + '</div><div><small>Humidity</small>' + (w.humidity != null ? Math.round(w.humidity) + '%' : '—') + '</div><div><small>Wind</small>' + (w.wind != null ? Math.round(w.wind) + ' ' + (w.windUnit || '') : '—') + '</div></div></div>'
}

