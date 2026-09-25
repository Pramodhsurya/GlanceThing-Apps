var root = document.getElementById('root')
var state = { ready: false, data: null, action: null }
function paint() {
  var body = ''
  if (!state.ready) body = '<div class="loading"><span class="material-icons">memory</span><p>Connecting to GlanceThing…</p></div>'
  else if (window.renderApp) body = window.renderApp(state)
  else body = '<div class="body"></div>'
  root.innerHTML = '<div class="header"><div class="title">Resource Usage</div><div class="status" data-online="' + state.ready + '">' + (state.ready ? 'Live' : 'Offline') + '</div></div>' + body
}
GT.connect(function (ws) {
  state.ready = true
  if ('system' === 'system') {
    var poll = function () { ws.sendType('system') }
    poll()
    setInterval(poll, 2000)
  } else if ('system' === 'playback') ws.sendType('playback', 'sources')
  else if ('system' === 'logs') ws.sendType('logs', 'subscribe')
  else if ('system' === 'recorder') ws.sendType('recorder', 'watch')
  else if ('system' === 'github') ws.sendType('github', 'overview')
  else if ('system' === 'link') ws.sendType('link', 'join')
  ws.listen(function (msg) {
    if (msg.type !== 'system' && msg.type !== 'playback') return
    state.data = msg.data
    state.action = msg.action
    if (window.onAppMessage) window.onAppMessage(msg, ws)
    paint()
  })
  paint()
})
paint()

window.renderApp = function (state) {
  var info = state.data
  if (!info || !info.cpu) return '<div class="loading"><span class="material-icons">memory</span><p>Reading system stats…</p></div>'
  var mem = Math.round((info.memory.used / info.memory.total) * 100)
  function gb(n) { var v = n / 1073741824; return (v >= 10 ? v.toFixed(0) : v.toFixed(1)) + ' GB' }
  function up(s) {
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'
  }
  var cores = (info.cpu.cores || []).map(function (v) {
    return '<div class="core"><div class="coreFill" style="height:' + Math.max(3, v) + '%"></div></div>'
  }).join('')
  return '<div class="body"><div class="gauges"><div class="gauge"><div class="gaugeValue">' + info.cpu.overall + '%</div><div class="gaugeLabel">CPU</div><div class="gaugeDetail">' + info.cpu.cores.length + ' cores</div></div>' +
    '<div class="gauge"><div class="gaugeValue">' + mem + '%</div><div class="gaugeLabel">RAM</div><div class="gaugeDetail">' + gb(info.memory.used) + ' / ' + gb(info.memory.total) + '</div></div></div>' +
    '<div class="details"><div class="card"><div class="cardLabel">Host</div><div>' + (info.hostname || '') + '</div><div class="model">' + (info.cpuModel || '') + '</div></div>' +
    '<div class="card"><div class="cardLabel">Per core</div><div class="cores">' + cores + '</div></div>' +
    '<div class="stats"><div><small>Load</small>' + (info.load || []).map(function (l) { return l.toFixed(2) }).join('  ') + '</div><div><small>Uptime</small>' + up(info.uptime) + '</div></div></div></div>'
}

