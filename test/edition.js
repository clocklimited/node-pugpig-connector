var edition = require('../lib/edition')
  , page = require('../lib/page')
  , et = require('elementtree')
  , should = require('should')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , testPath = 'edition-test-data/'

describe('edition', function () {
  before(mkdirp.bind(null, testPath))

  after(rimraf.bind(null, testPath))

  var atomValues =
      { title: 'test title'
      , summary: 'text summary'
      , author: 'Dom Harrington'
      , cover: 'image.jpg'
      , contents: 'atom.xml'
      , id: 'test-unique-id'
      }

  function checkAtomValues(xml) {
    var etree = et.parse(xml)

    etree.findtext('title').should.equal('test title')
    etree.findtext('summary').should.equal('text summary')
    etree.findtext('author/name').should.equal('Dom Harrington')
    etree.findtext('id').should.equal('test-unique-id')
  }

  it('should output Atom for attributes passed', function () {
    var edit = edition(atomValues)

    checkAtomValues(edit.xml)
    et.parse(edit.xml).find('link[@type="image/jpg"]').get('href').should.equal('image.jpg')
  })

  it('should not output wrong fields', function () {
    var edit = edition({ wrong: 'this is wrong'})

    var etree = et.parse(edit.xml)
    should.not.exist(etree.find('wrong'))
  })

  it('should have a link to itself: <link rel=\'self\'>')

  function addPages(edit) {
    for (var i = 0; i < 10; i += 1) {
      edit.pages.push(page({ title: 'page title ' + i }))
    }
  }

  describe('#publish()', function () {
    it('should have a publish function', function () {
      edition().publish.should.be.a('function')
    })

    it('should add an updated date when called', function (done) {
      var path = testPath + 'atom.xml'
        , edit = edition()
        , writeStream = edit.publish(path)

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        should.exist(edit.object.updated)
        done()
      }
    })

    it('should call #publish() on the page if it is not yet published', function (done) {
      var edit = edition()
        , page1 = page({ title: 'big title' })

      edit.pages.push(page1)

      var writeStream = edit.publish(testPath + 'atom.xml')

      writeStream.on('finish', function () {
        should.exist(page1.object.published)
        done()
      })
    })

    it('should not output page#publish() to XML', function (done) {
      var edit = edition()
        , page1 = page({ title: 'big title' })

      edit.pages.push(page1)

      var writeStream = edit.publish(testPath + 'atom.xml')

      writeStream.on('finish', onEditionWrite)

      function onEditionWrite() {
        fs.readFile(testPath + 'atom.xml', 'utf8', function (err, file) {
          var etree = et.parse(file)
          should.not.exist(etree.find('entry/publish'))
          done()
        })
      }
    })

    describe('published property', function () {
      it('should default to false', function () {
        edition().object.published.should.equal(false)
      })

      it('should be true when published', function (done) {
        var edit = edition()
          , writeStream = edit.publish(testPath + 'atom.xml')

        writeStream.on('finish', writeFinish)

        function writeFinish() {
          edit.object.published.should.equal(true)
          done()
        }
      })

      it('should not be present in the XML', function () {
        var etree = et.parse(edition().xml)
        should.not.exist(etree.find('published'))
      })
    })

    it('should write an XML file to a certain location', function (done) {
      var path = testPath + 'atom.xml'
        , writeStream = edition().publish(path)

      writeStream.on('finish', function () {
        fs.exists(path, function (exists) {
          exists.should.equal(true)
          done()
        })
      })
    })

    it('should output all pages to separate XML file', function (done) {
      var edit = edition(atomValues)
        , path = testPath + 'atom.xml'

      addPages(edit)
      var writeStream = edit.publish(path)
      writeStream.on('finish', writeFinish)

      function writeFinish() {
        fs.readFile(path, 'UTF-8', function (err, file) {
          var etree = et.parse(file)

          etree.findall('entry').length.should.equal(10)

          should.exist(etree.find('./').get('xmlns'))
          should.exist(etree.find('./').get('xmlns:app'))

          checkAtomValues(file)

          done()
        })
      }
    })

    it('should link to contents page from XML', function (done) {
      var edit = edition()
        , path = testPath + 'atom.xml'

      addPages(edit)
      var writeStream = edit.publish(path)
      writeStream.on('finish', writeFinish)

      function writeFinish() {
        var etree = et.parse(edit.xml)
          , atomLinks = etree.findall('link[@type="application/atom+xml"]')

        atomLinks.length.should.equal(2)
        atomLinks[0].get('rel').should.equal('alternate')
        atomLinks[0].get('href').should.equal(path)
        atomLinks[1].get('rel').should.equal('http://opds-spec.org/acquisition')
        atomLinks[1].get('href').should.equal(path)

        done()
      }
    })
  })

  describe('pages', function () {
    it('should be an array', function () {
      edition().pages.should.be.an.instanceOf(Array)
    })
  })

  describe('#add()', function () {
    it('should have an add function', function () {
      edition().add.should.be.a('function')
    })

    it('should add pages to array', function () {
      var edit = edition()
      for (var i = 1; i < 10; i += 1) {
        edit.add(page())
        edit.pages.length.should.equal(i)
      }
    })
  })
})
