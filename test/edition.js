var edition = require('../lib/edition')
  , page = require('../lib/page')
  , et = require('elementtree')
  , should = require('should')
  , rimraf = require('rimraf')
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
      , key: 'test-unique-key'
      }

  function checkAtomValues(xml) {
    var etree = et.parse(xml)

    etree.findtext('title').should.equal('test title')
    etree.findtext('summary').should.equal('text summary')
    etree.findtext('author/name').should.equal('Dom Harrington')
    etree.findtext('id').should.equal('test-unique-key')
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

  it('should have a link to itself: <link rel=\'self\'>', function () {
    var path = testPath + 'test.xml'
      , url = 'http://example.com'
      , xml = edition({ url: url }).publish(path).xml
      , etree = et.parse(xml)
      , linkEl = etree.find('link')

    linkEl.get('href').should.equal(url + '/test.xml')
    linkEl.get('rel').should.equal('self')
  })

  function addPages(edit) {
    for (var i = 0; i < 10; i += 1) {
      edit.add(page({ title: 'page title ' + i }))
    }
  }

  describe('#publish()', function () {
    it('should have a publish function', function () {
      edition().publish.should.be.a('function')
    })

    it('should add an updated date when called', function () {
      var path = testPath + 'atom.xml'
        , edit = edition()

      should.not.exist(edit.object.updated)
      edit.publish(path)
      should.exist(edit.object.updated)
    })

    it('should call #publish() on the page if it is not yet published', function () {
      var edit = edition()
        , page1 = page({ title: 'big title' })

      edit.add(page1)
      edit.publish(testPath + 'atom.xml')

      should.exist(page1.object.published)
    })

    it('should not output page properties to XML', function () {
      var edit = edition()
        , page1 = page({ title: 'big title' })

      edit.add(page1)

      var xml = edit.publish(testPath + 'atom.xml').xml
        , etree = et.parse(xml)

      should.not.exist(etree.find('entry/publish'))
      should.not.exist(etree.find('entry/object'))
      should.not.exist(etree.find('entry/html'))
      should.not.exist(etree.find('entry/xml'))
    })

    describe('published property', function () {
      it('should default to false', function () {
        edition().object.published.should.equal(false)
      })

      it('should be true when published', function () {
        var edit = edition()

        edit.publish(testPath + 'atom.xml')
        edit.object.published.should.equal(true)
      })

      it('should not be present in the XML', function () {
        var etree = et.parse(edition().xml)
        should.not.exist(etree.find('published'))
      })
    })

    it('should return an object with an `xml` key', function () {
      (function() {
        et.parse(edition().publish(testPath + 'atom.xml').xml)
      }).should.not.throwError()
    })

    it('should output all pages to array with XML strings', function () {
      var edit = edition(atomValues)
        , path = testPath + 'atom.xml'

      addPages(edit)
      var xml = edit.publish(path).xml
        , etree = et.parse(xml)

      etree.findall('entry').length.should.equal(10)

      should.exist(etree.find('./').get('xmlns'))
      should.exist(etree.find('./').get('xmlns:app'))

      checkAtomValues(xml)
    })

    it('should link to contents page from XML', function () {
      var edit = edition()
        , path = testPath + 'atom.xml'

      addPages(edit)
      var xml = edit.publish(path).xml
        , etree = et.parse(xml)
        , atomLinks = etree.findall('link[@type="application/atom+xml"]')

      atomLinks.length.should.equal(2)
      atomLinks[0].get('rel').should.equal('alternate')
      atomLinks[0].get('href').should.equal(path)
      atomLinks[1].get('rel').should.equal('http://opds-spec.org/acquisition')
      atomLinks[1].get('href').should.equal(path)
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
