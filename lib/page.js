module.exports = createPage

// Omitting XML declaration for pages
var data2xml = require('data2xml')({ xmlDecl: false })
  , fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , _ = require('lodash')
  , addFields = require('./utils').addFields
  , basename = require('path').basename
  , url = require('url')

function createPage(fields) {
  return new Page(fields)
}

function Page(fields) {
  if (!fields) fields = {}

  this.obj =
    { link: []
    }

  this.fields = fields
  this.html = ''

  addFields(['title'], this.obj, fields)

  if (fields.key) this.obj.id = fields.key

  if (fields.html) this.html = fields.html

  if (fields.category) {
    this.obj.category =
      { _attr:
        { scheme: 'http://schema.pugpig.com/section'
        , term: fields.category
        }
      }
  }

  Object.defineProperty(this, 'xml', { get: function () { return this.getXml() }})
  Object.defineProperty(this, 'object', { get: function () { return this.obj }})

  this.obj.published = false
}

Page.prototype.getXml = function () {
  return data2xml('entry', _.omit(this.obj, 'published'))
}

Page.prototype.publish = function (path) {
  // Updating published status
  this.obj.published = new Date().toISOString()

  // Updating updated status
  this.obj.updated = new Date().toISOString()

  var ee = new EventEmitter()
    , filesFinished = 0
    , baseFilename = path + '-' + this.obj.id
    , htmlFilename = baseFilename + '.html'
    , manifestFilename = baseFilename + '.manifest'
    , urlStr = this.fields.url ? url.resolve(this.fields.url, basename(htmlFilename)) : htmlFilename

  ee.on('fileFinish', function () {
    filesFinished += 1
    if (filesFinished === 2) {
      ee.emit('finish')
    }
  })

  function triggerFileFinish() {
    ee.emit('fileFinish')
  }

  var htmlWriteStream = fs.createWriteStream(htmlFilename)
  htmlWriteStream.on('finish', triggerFileFinish)
  htmlWriteStream.end(this.fields.html, 'utf8')

  var manifestWriteStream = fs.createWriteStream(manifestFilename)
  manifestWriteStream.on('finish', triggerFileFinish)
  // TODO need to work out best way of obtaining cache manifest from a HTML
  // file
  manifestWriteStream.end('CACHE MANIFEST', 'utf8')

  this.obj.link.push(
    { _attr:
      { rel: 'alternate'
      , type: 'text/html'
      , href: basename(htmlFilename)
      }
    })

  this.obj.link.push(
    { _attr:
      { rel: 'bookmark'
      , type: 'text/html'
      , href: urlStr
      }
    })

  this.obj.link.push(
    { _attr:
      { rel: 'related'
      , type: 'text/cache-manifest'
      , href: basename(manifestFilename)
      }
    })

  return ee
}
