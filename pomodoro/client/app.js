var DEFAULTS = { blocks: 4, focusMin: 25, shortMin: 5, longMin: 20, focusColor: '#f87171', breakColor: '#34d399', flash: true }
var SWATCHES = ['#f87171', '#fb923c', '#facc15', '#34d399', '#22d3ee', '#818cf8', '#e879f9']
var RING = 2 * Math.PI * 88
var settings = load('gt.pomodoro.settings', DEFAULTS)
var timer = load('gt.pomodoro.timer', fresh(DEFAULTS))
var now = Date.now()
var flashKey = 0
var showSettings = false

function load(key, fallback) {
  try {
    var raw = localStorage.getItem(key)
    return raw ? Object.assign({}, fallback, JSON.parse(raw)) : fallback
  } catch (e) { return fallback }
}
function save() {
  localStorage.setItem('gt.pomodoro.settings', JSON.stringify(settings))
  localStorage.setItem('gt.pomodoro.timer', JSON.stringify(timer))
}
function duration(mode, s) {
  if (mode === 'focus') return s.focusMin * 60000
  if (mode === 'short') return s.shortMin * 60000
  if (mode === 'long') return s.longMin * 60000
  return 0
}
function fresh(s) {
  return { mode: 'focus', session: 0, running: false, endAt: 0, remainingMs: duration('focus', s) }
}
function nextPhase(t, s) {
  if (t.mode === 'focus') return { mode: t.session >= s.blocks - 1 ? 'long' : 'short', session: t.session }
  if (t.mode === 'short') return { mode: 'focus', session: t.session + 1 }
  return { mode: 'done', session: t.session }
}
function prevPhase(t, s) {
  if (t.mode === 'done') return { mode: 'long', session: s.blocks - 1 }
  if (t.mode === 'short' || t.mode === 'long') return { mode: 'focus', session: t.session }
  if (t.session === 0) return { mode: 'focus', session: 0 }
  return { mode: 'short', session: t.session - 1 }
}
function enter(phase, s, running, from) {
  from = from || Date.now()
  var dur = duration(phase.mode, s)
  var keep = running && phase.mode !== 'done'
  return { mode: phase.mode, session: phase.session, running: keep, endAt: keep ? from + dur : 0, remainingMs: dur }
}
function remainingOf(t, tnow) { return t.running ? Math.max(0, t.endAt - tnow) : t.remainingMs }
function catchUp(t, s, tnow) {
  var advanced = false
  while (t.running && t.endAt <= tnow) {
    t = enter(nextPhase(t, s), s, true, t.endAt)
    advanced = true
  }
  return { timer: t, advanced: advanced }
}
function pad(n) { return (n < 10 ? '0' : '') + n }
function formatTime(ms) {
  var total = Math.ceil(ms / 1000)
  return pad(Math.floor(total / 60)) + ':' + pad(total % 60)
}

function render() {
  var remaining = remainingOf(timer, now)
  var total = duration(timer.mode, settings) || 1
  var progress = timer.mode === 'done' ? 1 : 1 - remaining / total
  var isBreak = timer.mode === 'short' || timer.mode === 'long'
  var accent = isBreak ? settings.breakColor : settings.focusColor
  var root = document.getElementById('root')
  root.style.setProperty('--accent', accent)
  var labels = { focus: 'Focus', short: 'Short break', long: 'Long break', done: 'All done' }
  var icons = { focus: 'psychology', short: 'local_cafe', long: 'self_improvement', done: 'celebration' }
  var dots = ''
  for (var i = 0; i < settings.blocks; i++) {
    var state = timer.mode === 'done' || i < timer.session ? 'done' : i === timer.session ? (timer.mode === 'focus' ? 'current' : 'done') : 'todo'
    dots += '<span class="dot" data-state="' + state + '" data-running="' + timer.running + '"></span>'
  }
  if (showSettings) {
    root.innerHTML = header() + '<div class="settings">' +
      stepper('Focus blocks', 'blocks', settings.blocks, 1, 10, 1) +
      stepper('Focus (min)', 'focusMin', settings.focusMin, 1, 90, 5) +
      stepper('Short break (min)', 'shortMin', settings.shortMin, 1, 30, 1) +
      stepper('Long break (min)', 'longMin', settings.longMin, 1, 60, 5) +
      swatches('Focus colour', 'focusColor', settings.focusColor) +
      swatches('Break colour', 'breakColor', settings.breakColor) +
      '<div class="row"><span>Flash screen when a phase ends</span><button type="button" class="toggle" data-on="' + settings.flash + '" data-act="flash"><span></span></button></div></div>'
  } else {
    root.innerHTML = (flashKey ? '<div class="flash"></div>' : '') + header() +
      '<div class="body"><div class="ringWrap"><svg viewBox="0 0 200 200" class="ring"><circle cx="100" cy="100" r="88" class="track"/><circle cx="100" cy="100" r="88" class="fill" stroke-dasharray="' + RING + '" stroke-dashoffset="' + (RING * (1 - progress)) + '"/></svg>' +
      '<div class="ringInner"><span class="material-icons">' + icons[timer.mode] + '</span><div class="clock">' + (timer.mode === 'done' ? '🎉' : formatTime(remaining)) + '</div><div class="modeLabel">' + labels[timer.mode] + '</div></div></div>' +
      '<div class="side"><div class="sessionLabel">' + (timer.mode === 'done' ? settings.blocks + ' of ' + settings.blocks + ' blocks complete' : 'Block ' + (timer.session + 1) + ' of ' + settings.blocks) + '</div>' +
      '<div class="dots">' + dots + '</div><div class="controls">' +
      '<button type="button" data-act="back"><span class="material-icons">skip_previous</span></button>' +
      '<button type="button" data-primary="true" data-act="toggle"><span class="material-icons">' + (timer.mode === 'done' ? 'replay' : timer.running ? 'pause' : 'play_arrow') + '</span></button>' +
      '<button type="button" data-act="skip"' + (timer.mode === 'done' ? ' disabled' : '') + '><span class="material-icons">skip_next</span></button></div>' +
      '<button type="button" class="reset" data-act="reset"><span class="material-icons">restart_alt</span> Reset all</button></div></div>'
  }
  function header() {
    return '<div class="header"><div class="title">Pomodoro</div><button type="button" class="iconBtn" data-act="settings" data-active="' + showSettings + '"><span class="material-icons">' + (showSettings ? 'close' : 'tune') + '</span></button></div>'
  }
  function stepper(label, key, value, min, max, step) {
    return '<div class="row"><span>' + label + '</span><div class="stepper"><button type="button" data-step="' + key + '" data-dir="-1" data-min="' + min + '" data-max="' + max + '" data-stepn="' + step + '"' + (value <= min ? ' disabled' : '') + '><span class="material-icons">remove</span></button><div class="stepValue">' + value + '</div><button type="button" data-step="' + key + '" data-dir="1" data-min="' + min + '" data-max="' + max + '" data-stepn="' + step + '"' + (value >= max ? ' disabled' : '') + '><span class="material-icons">add</span></button></div></div>'
  }
  function swatches(label, key, value) {
    return '<div class="row"><span>' + label + '</span><div class="swatches">' + SWATCHES.map(function (c) {
      return '<button type="button" data-color-key="' + key + '" data-color="' + c + '" style="background:' + c + '" data-on="' + (c === value) + '"></button>'
    }).join('') + '</div></div>'
  }
}

document.getElementById('root').addEventListener('click', function (e) {
  var btn = e.target.closest('button')
  if (!btn) return
  var t = Date.now()
  if (btn.getAttribute('data-act') === 'settings') showSettings = !showSettings
  if (btn.getAttribute('data-act') === 'toggle') {
    if (timer.mode === 'done') timer = enter({ mode: 'focus', session: 0 }, settings, true, t)
    else if (timer.running) timer = { mode: timer.mode, session: timer.session, running: false, endAt: 0, remainingMs: remainingOf(timer, t) }
    else timer = { mode: timer.mode, session: timer.session, running: true, endAt: t + timer.remainingMs, remainingMs: timer.remainingMs }
  }
  if (btn.getAttribute('data-act') === 'skip') timer = enter(nextPhase(timer, settings), settings, timer.running)
  if (btn.getAttribute('data-act') === 'back') {
    var rem = remainingOf(timer, t)
    var tot = duration(timer.mode, settings) || 1
    var restartOnly = tot - rem > 3000 || (timer.mode === 'focus' && timer.session === 0)
    timer = enter(restartOnly ? { mode: timer.mode, session: timer.session } : prevPhase(timer, settings), settings, timer.running)
  }
  if (btn.getAttribute('data-act') === 'reset') timer = fresh(settings)
  if (btn.getAttribute('data-act') === 'flash') settings.flash = !settings.flash
  if (btn.getAttribute('data-step')) {
    var key = btn.getAttribute('data-step')
    var next = settings[key] + Number(btn.getAttribute('data-dir')) * Number(btn.getAttribute('data-stepn'))
    settings[key] = Math.max(Number(btn.getAttribute('data-min')), Math.min(Number(btn.getAttribute('data-max')), next))
    if (!timer.running) timer = enter({ mode: timer.mode, session: Math.min(timer.session, settings.blocks - 1) }, settings, false)
  }
  if (btn.getAttribute('data-color')) {
    settings[btn.getAttribute('data-color-key')] = btn.getAttribute('data-color')
  }
  save()
  render()
})

setInterval(function () {
  now = Date.now()
  var caught = catchUp(timer, settings, now)
  if (caught.advanced) {
    timer = caught.timer
    if (settings.flash) flashKey += 1
    save()
  }
  if (!showSettings) render()
}, 250)
render()
