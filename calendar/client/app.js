var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">calendar_today</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Calendar</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
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
  var cal = state.data && state.data.calendar
  var events = (cal && cal.events) || []
  var picks = [['teams','Teams'],['mac','Mac'],['slack','Slack'],['google','Google']].map(function (s) {
    return '<button type="button" onclick="window._import(\'' + s[0] + '\')">' + s[1] + '</button>'
  }).join('')
  if (!events.length) {
    return '<div class="empty"><div class="sources">' + picks + '</div><span class="material-icons">calendar_today</span><p>' + ((cal && cal.message) || 'Import from Teams, Mac, Slack, or Google Calendar.') + '</p></div>'
  }
  var rows = events.slice(0, 8).map(function (ev) {
    return '<div class="item"><strong>' + (ev.title || '').replace(/^Canceled:\s*/i, '') + '</strong><div>' + (ev.when || '') + (ev.where ? ' · ' + ev.where : '') + '</div></div>'
  }).join('')
  return '<div class="body"><div class="sources">' + picks + '</div><div class="list">' + rows + '</div></div>'
}
window._import = function (source) {
  if (window._ws) window._ws.sendType('calendar', 'import', { source: source })
}

