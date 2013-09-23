var editionContainer = require('../lib/container')
  , edition = require('../lib/edition')
  , page = require('../lib/page')
  , should = require('should')
  , et = require('elementtree')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , testPath = 'container-test-data/'

describe('edition-container', function () {
  before(mkdirp.bind(null, testPath))

  after(rimraf.bind(null, testPath))

  it('should output OPDS for attributes passed', function () {
    var container = editionContainer(
      { title: 'test title'
      , author: 'Dom Harrington'
      , key: 'test-unique-key'
      })

    var etree = et.parse(container.xml)

    etree.findtext('title').should.equal('test title')
    etree.findtext('author/name').should.equal('Dom Harrington')
    etree.findtext('key').should.equal('test-unique-key')
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

  it('should have a link to itself: <link rel=\'self\'>')

  describe('#publish()', function () {
    it('should have a publish function', function () {
      editionContainer().publish.should.be.a('function')
    })

    it('should error if no title provided')
    it('should error if no ID provided')
    it('should error if no contents given')

    describe('pricing information', function () {
      it('should not error if no information given')
      it('should default to free')
    })

    it('should write an XML file to a certain location', function (done) {
      var path = testPath + 'test.xml'
      var writeStream = editionContainer().publish(path)
      writeStream.on('finish', function () {
        fs.exists(path, function (exists) {
          exists.should.equal(true)
          done()
        })
      })
    })

    it('should add an updated date when called', function (done) {
      var path = testPath + 'test.xml'
        , container = editionContainer()
        , writeStream = container.publish(path)

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        should.exist(container.object.updated)
        done()
      }
    })

    it('should call publish on editions and pages within the container', function (done) {
      var path = testPath + 'test.xml'
        , container = editionContainer()
        , edit = edition({ key: 'edition-key' })
        , page1 = page({ title: 'page title' })

      edit.object.published.should.equal(false)
      page1.object.published.should.equal(false)

      edit.pages.push(page1)
      container.add(edit)

      var writeStream = container.publish(path)
      writeStream.on('finish', writeFinish)

      function writeFinish() {
        edit.object.published.should.equal(true)
        should.exist(page1.object.published)
        done()
      }
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
