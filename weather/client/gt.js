/* Shared GlanceThing community-app helper. Chrome 69 safe. */
(function (root) {
  function $(sel, el) {
    return (el || document).querySelector(sel)
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag)
    attrs = attrs || {}
    Object.keys(attrs).forEach(function (key) {
      if (key === 'className') node.className = attrs[key]
      else if (key === 'text') node.textContent = attrs[key]
      else if (key === 'html') node.innerHTML = attrs[key]
      else if (key.indexOf('on') === 0 && typeof attrs[key] === 'function')
        node.addEventListener(key.slice(2).toLowerCase(), attrs[key])
      else if (key === 'dataset') {
        Object.keys(attrs.dataset).forEach(function (d) {
          node.setAttribute('data-' + d, attrs.dataset[d])
        })
      } else if (attrs[key] !== undefined && attrs[key] !== null) {
        node.setAttribute(key, attrs[key])
      }
    })
    ;(children || []).forEach(function (child) {
      if (child) node.appendChild(child)
    })
    return node
  }

  function icon(name) {
    return el('span', { className: 'material-icons', text: name })
  }

  function formatMs(ms) {
    if (!isFinite(ms) || ms < 0) ms = 0
    var total = Math.floor(ms / 1000)
    var h = Math.floor(total / 3600)
    var m = Math.floor((total % 3600) / 60)
    var s = total % 60
    var mm = h ? String(m).length < 2 ? '0' + m : String(m) : String(m)
    var ss = String(s).length < 2 ? '0' + s : String(s)
    return (h ? h + ':' : '') + mm + ':' + ss
  }

  function connect(onReady) {
    var ws = new WebSocket('ws://localhost:1337')
    var ready = false

    function auth() {
      fetch('/ws-password')
        .then(function (res) {
          return res.text()
        })
        .then(function (pass) {
          ws.send(
            JSON.stringify({
              type: 'auth',
              data: String(pass).replace(/\n/g, '')
            })
          )
        })
        .catch(function () {
          ws.close()
        })
    }

    ws.onopen = auth
    ws.onmessage = function (event) {
      var msg
      try {
        msg = JSON.parse(event.data)
      } catch (err) {
        return
      }
      if (msg.type === 'auth') {
        ready = true
        if (onReady) onReady(ws)
      }
      if (ws._listeners && ws._listeners.length) {
        ws._listeners.forEach(function (fn) {
          fn(msg)
        })
      }
    }
    ws.onclose = function () {
      ready = false
      setTimeout(function () {
        if (root.GT && root.GT._reconnect !== false) connect(onReady)
      }, 1000)
    }
    ws.listen = function (fn) {
      ws._listeners = ws._listeners || []
      ws._listeners.push(fn)
    }
    ws.sendType = function (type, action, data) {
      if (ws.readyState !== 1) return
      var payload = { type: type }
      if (action) payload.action = action
      if (data !== undefined) payload.data = data
      ws.send(JSON.stringify(payload))
    }
    ws.isReady = function () {
      return ready
    }
    return ws
  }

  root.GT = {
    $: $,
    el: el,
    icon: icon,
    formatMs: formatMs,
    connect: connect
  }
})(window)
