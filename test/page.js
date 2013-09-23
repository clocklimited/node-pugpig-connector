var editionPage = require('../lib/page')
  , et = require('elementtree')
  , should = require('should')
  , rimraf = require('rimraf')
  , fs = require('fs')
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

      it('should exist when published', function (done) {
        var pageEntry = editionPage({ title: 'made up title' })
          , writeStream = pageEntry.publish(join(__dirname, testPath + 'page'))

        writeStream.on('finish', function () {
          should.exist(pageEntry.object.published)
          done()
        })
      })

      it('should not be present in the XML', function () {
        var etree = et.parse(editionPage().xml)
        should.not.exist(etree.find('published'))
      })
    })

    it('should have an updated property when published', function (done) {
      var pageEntry = editionPage({ title: 'made up title' })
        , writeStream = pageEntry.publish(join(__dirname, testPath + 'page'))

      writeStream.on('finish', function () {
        should.exist(pageEntry.object.updated)
        done()
      })
    })

    it('should write a HTML file to a certain location', function (done) {
      var html = '<h1>Hello world</h1>'
        , key = '789'
        , htmlTitle = '-' + key + '.html'
        , url = 'http://example.com/'
        , pageEntry = editionPage(
          { title: 'Made up title'
          , html: html
          , key: key
          , url: url
          })
        , path = join(__dirname, testPath)
        , writeStream = pageEntry.publish(path)

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        fs.readFile(join(path, '-789.html'), 'utf8', function (err, file) {
          file.toString().should.equal(html)
          checkLinks()
          done()
        })
      }

      function checkLinks() {
        var etree = et.parse(pageEntry.xml)
          , links = etree.findall('link')

        links.length.should.equal(3)
        links[0].get('rel').should.equal('alternate')
        links[0].get('type').should.equal('text/html')
        links[0].get('href').should.equal(htmlTitle)
        links[1].get('rel').should.equal('bookmark')
        links[1].get('type').should.equal('text/html')
        // TODO this should include an absolute link to this resource
        links[1].get('href').should.equal(url + htmlTitle)
        links[2].get('rel').should.equal('related')
        links[2].get('type').should.equal('text/cache-manifest')
        links[2].get('href').should.equal('-' + key + '.manifest')
      }
    })

    it('should write a manifest file to a certain location', function (done) {
      var html = '<img src="hello.jpg" />'
        , pageEntry = editionPage(
          { title: 'Made up title'
          , html: html
          })
        , path = join(__dirname, testPath)
        , writeStream = pageEntry.publish(path)

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        fs.readFile(join(path, '-789.manifest'), function (err, file) {
          file.toString().should.equal('CACHE MANIFEST')
          // file.toString().should.equal('CACHE MANIFEST\nhello.jpg')
          done()
        })
      }
    })
  })
})
