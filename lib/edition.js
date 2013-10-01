module.exports = createEdition

// Omitting XML declaration for entries
var data2xml = require('data2xml')({ xmlDecl: false })
  , data2xmlWithXmlDecl = require('data2xml')()
  , fs = require('fs')
  , _ = require('lodash')
  , addFields = require('./utils').addFields
  , EventEmitter = require('events').EventEmitter
  , url = require('url')
  , basename = require('path').basename

function createEdition(fields) {
  return new Edition(fields)
}

function Edition(fields) {
  if (!fields) fields = {}

  this.obj = {}
  this.fields = fields

  addFields(['title', 'summary'], this.obj, fields)

  if (fields.key) this.obj.id = fields.key

  if (fields.author) {
    this.obj.author =
      { name: fields.author
      }
  }

  this.obj.link = []

  if (fields.cover) {
    this.obj.link.push(
      { _attr:
        { rel: 'http://opds-spec.org/image'
        , type: 'image/jpg'
        , href: fields.cover
        }
      })
  }

  this.obj.pages = []
  this.obj.published = false

  Object.defineProperty(this, 'xml', { get: function () { return this.getXml() }})
  Object.defineProperty(this, 'object', { get: function () { return this.obj }})
  Object.defineProperty(this, 'pages', { get: function () { return this.obj.pages }})
}

Edition.prototype.getXml = function () {
  return data2xml('entry', _.omit(this.obj, 'published'))
};

Edition.prototype.publishEdition = function (path) {
  var writeStream = fs.createWriteStream(path)
    , urlStr = this.fields.url ? url.resolve(this.fields.url, basename(path)) : path
    , contents =
      { _attr:
        { xmlns: 'http://www.w3.org/2005/Atom'
        , 'xmlns:app': 'http://www.w3.org/2007/app'
        }
      , entry: _.map(this.obj.pages, function (p) { return p.object })
      , link:
        { _attr:
          { rel: 'self'
          , href: urlStr
          }
        }
      }

  delete this.obj.pages

  this.obj.link.push(
    { _attr:
      { rel: 'alternate'
      , type: 'application/atom+xml'
      , href: path
      }
    })

  this.obj.link.push(
    { _attr:
      { rel: 'http://opds-spec.org/acquisition'
      , type: 'application/atom+xml'
      , href: path
      }
    })

  this.obj.updated = new Date().toISOString()
  this.obj.published = true

  contents = _.extend(_.pick(this.obj, 'title', 'summary', 'author', 'id'), contents)
  writeStream.end(data2xmlWithXmlDecl('feed', contents), 'utf8')

  return writeStream
}

Edition.prototype.publishPage = function (ee, path, page) {
  var writeStream = page.publish(path)
  writeStream.on('finish', ee.emit.bind(ee, 'pageFinish'))
  return writeStream
}

Edition.prototype.publish = function (path) {
  if (this.obj.pages.length === 0) return this.publishEdition(path)

  var ee = new EventEmitter()
    , pagesFinished = 1

  ee.on('pageFinish', function () {
    if (pagesFinished === this.obj.pages.length) {
      ee.emit('pagesPublished')
    }
    pagesFinished += 1
  }.bind(this))

  this.obj.pages.forEach(this.publishPage.bind(null, ee, path))

  ee.on('pagesPublished', function () {
    var writeStream = this.publishEdition(path)

    writeStream.on('finish', ee.emit.bind(ee, 'finish'))
  }.bind(this))

  return ee
}

Edition.prototype.add = function (edition) {
  this.obj.pages.push(edition)
}
