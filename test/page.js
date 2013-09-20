var editionPage = require('../lib/page')
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
      , id: 'test-unique-id'
      })

    var etree = et.parse(pageEntry.xml)

    etree.findtext('title').should.equal('test title')
    etree.findtext('id').should.equal('test-unique-id')

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

    it('should error if no ID provided')

    describe('published property', function () {
      it('should default to false', function () {
        editionPage().object.published.should.equal(false)
      })

      it('should exist when published', function (done) {
        var pageEntry = editionPage({ title: 'made up title' })
          , writeStream = pageEntry.publish()

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
        , writeStream = pageEntry.publish()

      writeStream.on('finish', function () {
        should.exist(pageEntry.object.updated)
        done()
      })
    })

    it('should not error if no summary provided')
    it('should error if no HTML given')

    it('should write a HTML file to a certain location', function (done) {
      var html = '<h1>Hello world</h1>'
        , fileTitle = 'made-up-title'
        , htmlTitle = fileTitle + '.html'
        , pageEntry = editionPage(
          { title: 'Made up title'
          , html: html
          })
        , writeStream = pageEntry.publish()

      writeStream.on('finish', writeFinish)

      function writeFinish() {
        fs.readFile(htmlTitle, 'UTF-8', function (err, file) {
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
        links[1].get('href').should.equal(htmlTitle)
        links[2].get('rel').should.equal('related')
        links[2].get('type').should.equal('text/cache-manifest')
        links[2].get('href').should.equal(fileTitle + '.manifest')
      }
    })

    it('should write a manifest file to a certain location', function (done) {
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
          file.toString().should.equal('CACHE MANIFEST')
          // file.toString().should.equal('CACHE MANIFEST\nhello.jpg')
          done()
        })
      }
    })
  })
})
