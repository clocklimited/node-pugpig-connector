var Mocha = require('mocha')
  , join = require('path').join

require('should')

var mocha = new Mocha()
  , counts =
    { total: 0
    , pass: 0
    , fail: 0
    }

mocha.reporter('spec').ui('bdd')

mocha.addFile(join(__dirname, 'container.js'))
mocha.addFile(join(__dirname, 'edition.js'))
mocha.addFile(join(__dirname, 'page.js'))

var runner = mocha.run(function () {
  console.log('Finished', counts)
  process.exit(counts.fail === 0 ? 0 : 1)
})

runner.on('pass', function () {
  counts.total += 1
  counts.pass += 1
})

runner.on('fail', function () {
  counts.total += 1
  counts.fail += 1
})
