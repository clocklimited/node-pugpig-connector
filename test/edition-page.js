var editionPage = require('../lib/edition-page')
  , et = require('elementtree')
  , should = require('should')
  , fs = require('fs')
  , rimraf = require('rimraf')

describe('edition-page', function () {
  after(function (done) {
    rimraf('made-up-title.html', function () {
      rimraf('made-up-title.manifest', done)
    })
  })

  it('should output Atom for attributes passed', function () {
    var pageEntry = editionPage(
      { title: 'test title'
      , html: '<h1>Test HTML</h1>'
      , manifest: ''
      , category: 'Test category'
      })

    var etree = et.parse(pageEntry.xml)

    etree.findtext('title').should.equal('test title')

    var categoryEl = etree.find('category')
    categoryEl.get('scheme').should.equal('http://schema.pugpig.com/section')
    categoryEl.get('term').should.equal('Test category')

    pageEntry.html.should.equal('<h1>Test HTML</h1>')
  })

  it('should not output wrong fields', function () {
    var pageEntry = editionPage({ wrong: 'this is wrong'})

    var etree = et.parse(pageEntry.xml)
    should.not.exist(etree.find('wrong'))
  })

  it('should generate a unique ID')

  describe('#publish()', function () {
    it('should have a publish function', function () {
      editionPage().publish.should.be.a('function')
    })

    it('should error if no title provided', function () {
      (function () {
        editionPage().publish()
      }).should.throwError('No page title')
    })

    it('should not error if no summary provided')
    it('should error if no HTML given')

    it('should write a HTML file to a certain location', function (done) {
      var html = '<h1>Hello world</h1>'
        , pageEntry = editionPage(
          { title: 'Made up title'
          , html: html
          })
        , writeStream = pageEntry.publish()

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        fs.readFile('made-up-title.html', 'UTF-8', function (err, file) {
          file.toString().should.equal(html)
          done()
        })
      }
    })

    it.skip('should write a manifest file to a certain location', function (done) {
      var dir = './'
        , html = '<img src="hello.jpg" />'
        , pageEntry = editionPage(
          { title: 'Made up title'
          , html: html
          })
        , writeStream = pageEntry.publish(dir)

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        fs.readFile('made-up-title.manifest', function (err, file) {
          file.toString().should.equal('CACHE MANIFEST\nhello.jpg')
          done()
        })
      }
    })
  })
})
