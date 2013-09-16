var editionContainer = require('../lib/edition-container')
  , edition = require('../lib/edition')
  , should = require('should')
  , et = require('elementtree')
  , rimraf = require('rimraf')
  , fs = require('fs')

describe('edition-container', function () {
  after(function (done) {
    rimraf('test.xml', done)
  })

  it('should output OPDS for attributes passed', function () {
    var container = editionContainer(
      { title: 'test title'
      , author: 'Dom Harrington'
      })

    var etree = et.parse(container.xml)

    etree.findtext('title').should.equal('test title')
    etree.findtext('author/name').should.equal('Dom Harrington')
  })

  it('should not output wrong fields', function () {
    var container = editionContainer({ wrong: 'this is wrong'})

    var etree = et.parse(container.xml)
    should.not.exist(etree.find('wrong'))
  })

  it('should have a feed tag with certain attributes', function () {
    var etree = et.parse(editionContainer().xml)

    should.exist(etree.find('./').get('xmlns'))
    should.exist(etree.find('./').get('xmlns:dcterms'))
    should.exist(etree.find('./').get('xmlns:opds'))
  })

  it('should generate a unique ID')
  it('should have a link to itself: <link rel=\'self\'>')

  describe('#publish()', function () {
    it('should have a publish function', function () {
      editionContainer().publish.should.be.a('function')
    })

    it('should error if no title provided')
    it('should warn if no contents given')
    it('should not error if no summary provided')

    describe('pricing information', function () {
      it('should not error if no information given')
      it('should default to free')
    })

    it('should write an XML file to a certain location', function (done) {
      var path = 'test.xml'
      var writeStream = editionContainer().publish(path)
      writeStream.on('finish', function () {
        fs.exists(path, function (exists) {
          exists.should.equal(true)
          done()
        })
      })
    })
  })

  describe('#add()', function () {
    it('should have an add function', function () {
      editionContainer().add.should.be.a('function')
    })

    it('should add editions as <entry>', function () {
      var container = editionContainer()
      for (var i = 1; i < 10; i += 1) {
        container.add(edition())
        var etree = et.parse(container.xml)
        etree.findall('entry').length.should.equal(i)
      }
    })
  })

  describe('#xml()', function () {
    it('should output XML', function () {
      (function () {
        et.parse(editionContainer().xml)
      }).should.not.throwError()
    })
  })
})
