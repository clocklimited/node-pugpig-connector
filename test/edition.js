var edition = require('../lib/edition')
  , page = require('../lib/edition-page')
  , et = require('elementtree')
  , should = require('should')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , async = require('async')

describe('edition', function () {
  after(function (done) {
    async.series(
      [ rimraf.bind(null, 'atom.xml')
      , rimraf.bind(null, 'big-title.html')
      , rimraf.bind(null, 'big-title.manifest')
      ], done)
  })

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
      edit.add({ object: {}})
    }
  }

  describe('#publish()', function () {
    it('should have a publish function', function () {
      edition().publish.should.be.a('function')
    })

    it('should add an updated date when called', function (done) {
      var path = 'atom.xml'
        , edit = edition()
        , writeStream = edit.publish(path)

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        should.exist(edit.object.updated)
        done()
      }
    })

    it('should have a published property')

    it('should error if no title provided')
    it('should error if no ID provided')
    it('should not error if no summary provided')
    it('should error if no link to cover image provided')
    it('should warn if no contents given')

    it('should write an XML file to a certain location', function (done) {
      var path = 'atom.xml'
      var writeStream = edition().publish(path)
      writeStream.on('finish', function () {
        fs.exists(path, function (exists) {
          exists.should.equal(true)
          done()
        })
      })
    })

    it('should output all pages to separate XML file', function (done) {
      var edit = edition(atomValues)
        , path = 'atom.xml'

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
        , path = 'atom.xml'

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

  describe('#add()', function () {
    it('should have an add function', function () {
      edition().add.should.be.a('function')
    })

    it('should add pages to entries array', function () {
      var edit = edition()
      edit.pages.length.should.equal(0)
      addPages(edit)
      edit.pages.length.should.equal(10)
    })

    it('should call #publish() on the page if it is not yet published', function () {
      var edit = edition()
        , pageEntry = page({ title: 'big title' })

      edit.add(pageEntry)
      should.exist(pageEntry.object.published)
    })
  })
})
