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
    etree.findtext('id').should.equal('test-unique-key')
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

  it('should have a link to itself: <link rel=\'self\'>', function (done) {
    var path = testPath + 'test.xml'
      , url = 'http://example.com'
      , writeStream = editionContainer({ url: url }).publish(path)

    writeStream.on('finish', function () {
      var file = fs.readFileSync(path).toString()
        , etree = et.parse(file)
        , linkEl = etree.find('link')

      linkEl.get('href').should.equal(url + '/test.xml')
      linkEl.get('rel').should.equal('self')
      done()
    })
  })

  describe('#publish()', function () {
    it('should have a publish function', function () {
      editionContainer().publish.should.be.a('function')
    })

    describe('pricing information', function () {
      it('should not error if no information given')
      it('should default to free')
    })

    it('should write an XML file to a certain location', function (done) {
      var path = testPath + 'test.xml'
        , writeStream = editionContainer().publish(path)

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
        , page1key = 'page-title-id'
        , page2key = 'page2-title-id'
        , page1 = page({ title: 'page title', key: page1key })
        , page2 = page({ title: 'page title 2', key: page2key })

      edit.object.published.should.equal(false)
      page1.object.published.should.equal(false)
      page2.object.published.should.equal(false)

      edit.add(page1)
      edit.add(page2)
      container.add(edit)

      var writeStream = container.publish(path)
      writeStream.on('finish', writeFinish)

      function writeFinish() {
        edit.object.published.should.equal(true)
        should.exist(page1.object.published)
        should.exist(page2.object.published)
        fs.existsSync(testPath + 'edition-key-atom.xml-' + page1key + '.html').should.equal(true)
        fs.existsSync(testPath + 'edition-key-atom.xml-' + page2key + '.html').should.equal(true)
        fs.existsSync(testPath + 'edition-key-atom.xml-' + page1key + '.manifest').should.equal(true)
        fs.existsSync(testPath + 'edition-key-atom.xml-' + page2key + '.manifest').should.equal(true)
        done()
      }
    })

    it('should not output edition properties to XML', function (done) {
      var container = editionContainer()
        , edit = edition({ key: 'key' })

      container.add(edit)
      var writeStream = container.publish(testPath + 'atom.xml')

      writeStream.on('finish', onContainerWrite)

      function onContainerWrite() {
        fs.readFile(testPath + 'atom.xml', 'utf8', function (err, file) {
          var etree = et.parse(file)
          should.not.exist(etree.find('entry/object'))
          should.not.exist(etree.find('entry/add'))
          should.not.exist(etree.find('entry/publish'))
          should.not.exist(etree.find('entry/xml'))
          done()
        })
      }
    })

    it('should not output page properties to xml', function (done) {
      var container1 = editionContainer(
          { title: 'test title'
          , image: 'image.jpg'
          , author: 'Dom Harrington'
          , key: 'tag:example.com,2013-09:books/first-book'
          })
        , edit = edition(
          { title: 'test title'
          , summary: 'text summary'
          , author: 'Dom Harrington'
          , cover: 'image.jpg'
          , key: 'tag:example.com,2013-09:first-book'
          })
        , page1 = page(
          { title: 'page 1'
          , html: '<h1>This is the first page</h1>'
          , category: 'introduction'
          , key: 'page1-id'
          })
        , page2 = page(
          { title: 'page 2'
          , html: '<h1>This is the second page</h1>'
          , category: 'introduction'
          , key: 'page2-id'
          })

      // add pages to edition
      edit.add(page1)
      edit.add(page2)

      // add edition to container
      container1.add(edit)

      // generates edition container contents
      var writeStream = container1.publish(testPath + 'container.xml')

      writeStream.on('finish', onWriteFinish)

      function onWriteFinish() {
        var file = fs.readFileSync(testPath + 'container.xml').toString()
          , etree = et.parse(file)

        should.not.exist(etree.find('entry/pages/object'))
        should.not.exist(etree.find('entry/pages/html'))
        should.not.exist(etree.find('entry/pages/publish'))
        should.not.exist(etree.find('entry/pages/xml'))
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
