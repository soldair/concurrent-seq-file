var Sf = require('seq-file')

module.exports = function (file, options) {
  options = options || {}

  var sf = new Sf(file, options)
  patchSeq(sf)

  var delay = options.delay || 1000

  var started = {}
  var dones = {}
  var saving = false

  // for managing concurrent saves.
  var saveQ = false
  var saveValue = sf.readSync()

  startSequence.value = saveValue

  return startSequence

  function startSequence (seq, opts) {
    started[seq] = 1
    return function (cb) {
      delete started[seq]
      var startedSeq = least(started)

      if (dones[seq]) {
        return cb(new Error("shouldn't done the same sequence id more than once concurrently"))
      }
      dones[seq] = cb || noop

      // always save the highest number in the dones that's less than the lowest number in the actives
      var endSeq = false
      var cbs = []
      Object.keys(dones).forEach(function (k) {
        if (!startedSeq || (k < startedSeq && k >= endSeq)) {
          endSeq = k
          cbs.push(dones[k])
          delete dones[k]
        }
      })

      if (!endSeq || (+endSeq === +saveValue)) return unroll(false, +saveValue, cbs)

      saveValue = endSeq

      if (!saveQ) saveQ = []
      // im either already waiting or my save loop is idle and i have not yet completed the lowest started sequence
      if (saving || !saveValue) return saveQ.push.apply(saveQ, cbs)

      saveLoop(cbs)

      function saveLoop (cbs) {
        saving = true
        var savedValue = +saveValue

        save(sf, savedValue, function (err) {
          startSequence.value = +savedValue
          unroll(err, +savedValue, cbs)
          setTimeout(function () {
            saving = false
            if (saveQ.length) {
              cbs = saveQ
              saveQ = []
              saveLoop(cbs)
            }
          }, delay)
        })
      }
    }
  }
}

function save (sf, seq, cb) {
  sf.savecbs.push(function (err) {
    if (cb) cb(err)
  })
  sf.save(seq)
}

function patchSeq (sf) {
  if (sf.savecbs) return
  sf.savecbs = []
  var ofinish = sf.onFinish
  sf.onFinish = function (err) {
    ofinish.apply(this, arguments)
    var cbs = sf.savecbs
    sf.savecbs = []
    if (cbs) while (cbs.length) cbs.shift()(err)
  }
}

function least (obj) {
  var v = 0
  Object.keys(obj).forEach(function (k) {
    if (!v || +k < v) v = +k
  })
  return v
}

function unroll (err, data, cbs) {
  while (cbs.length) cbs.shift()(err, data)
}

function noop () {}
