var editionPage = require('../lib/page')
  , et = require('elementtree')
  , should = require('should')
  , rimraf = require('rimraf')
  , join = require('path').join
  , mkdirp = require('mkdirp')
  , testPath = 'page-test-data/'

describe('edition-page', function () {
  before(mkdirp.bind(null, join(__dirname, testPath)))

  after(rimraf.bind(null, join(__dirname, testPath)))

  it('should output Atom for attributes passed', function () {
    var pageEntry = editionPage(
      { title: 'test title'
      , html: '<h1>Test HTML</h1>'
      , manifest: ''
      , category: 'Test category'
      , key: 'test-unique-key'
      })

    var etree = et.parse(pageEntry.xml)

    etree.findtext('title').should.equal('test title')
    etree.findtext('id').should.equal('test-unique-key')

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

  describe('#publish()', function () {
    it('should have a publish function', function () {
      editionPage().publish.should.be.a('function')
    })

    describe('published property', function () {
      it('should default to false', function () {
        editionPage().object.published.should.equal(false)
      })

      it('should exist when published', function () {
        var pageEntry = editionPage({ title: 'made up title' })

        pageEntry.publish(join(__dirname, testPath + 'page'))
        should.exist(pageEntry.object.published)
      })

      it('should not be present in the XML', function () {
        var etree = et.parse(editionPage().xml)
        should.not.exist(etree.find('published'))
      })
    })

    it('should have an updated property when published', function () {
      var pageEntry = editionPage({ title: 'made up title' })

      pageEntry.publish(join(__dirname, testPath + 'page'))
      should.exist(pageEntry.object.updated)
    })

    it('should return a HTML string', function () {
      var html = '<h1>Hello world</h1>'
        , key = '789'
        , htmlTitle = key + '.html'
        , url = 'http://example.com/'
        , pageEntry = editionPage(
          { title: 'Made up title'
          , html: html
          , key: key
          , url: url
          })
        , path = join(__dirname, testPath)
        , pageHtml = pageEntry.publish(path).html
        , etree = et.parse(pageEntry.xml)
        , links = etree.findall('link')

      pageHtml.file.should.equal('789.html')
      pageHtml.content.should.equal(html)

      links.length.should.equal(3)
      links[0].get('rel').should.equal('alternate')
      links[0].get('type').should.equal('text/html')
      links[0].get('href').should.equal(htmlTitle)
      links[1].get('rel').should.equal('bookmark')
      links[1].get('type').should.equal('text/html')
      links[1].get('href').should.equal(url + htmlTitle)
      links[2].get('rel').should.equal('related')
      links[2].get('type').should.equal('text/cache-manifest')
      links[2].get('href').should.equal(key + '.manifest')
    })

    it('should write a manifest file to a certain location', function () {
      var html = '<img src="hello.jpg" />'
        , pageEntry = editionPage(
          { title: 'Made up title'
          , html: html
          , key: '789'
          })
        , path = join(__dirname, testPath)
        , pageManifest = pageEntry.publish(path).manifest

      pageManifest.file.should.equal('789.manifest')
      pageManifest.content.should.equal('CACHE MANIFEST')
    })
  })
})
