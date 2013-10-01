module.exports = createContainer

var data2xml = require('data2xml')()
  , fs = require('fs')
  , addFields = require('./utils').addFields
  , EventEmitter = require('events').EventEmitter
  , dirname = require('path').dirname
  , join = require('path').join
  , basename = require('path').basename
  , _ = require('lodash')
  , url = require('url')

function createContainer(fields) {
  return new Container(fields)
}

function Container(fields) {
  if (!fields) fields = {}

  this.obj = {}
  this.url = fields.url || ''
  this.fields = fields

  this.obj.updated = null

  addFields(['title'], this.obj, fields)

  if (fields.key) this.obj.id = fields.key

  if (fields.author) {
    this.obj.author =
      { name: fields.author
      }
  }

  this.obj._attr =
    { xmlns: 'http://www.w3.org/2005/Atom'
    , 'xmlns:dcterms': 'http://purl.org/dc/terms/'
    , 'xmlns:opds': 'http://opds-spec.org/2010/catalog'
    }

  this.obj.link =
    { _attr:
      { rel: 'self'
      , href: ''
      , type: 'application/atom+xml;profile=opds-catalog;kind=acquisition'
      }
    }

  this.obj.entry = []

  Object.defineProperty(this, 'xml', { get: function () { return this.getXml() }})
  Object.defineProperty(this, 'object', { get: function () { return this.obj }})

  return this
}

Container.prototype.publishEdition = function (ee, path, edition) {
  var writeStream = edition.publish(join(dirname(path), edition.object.id + '-atom.xml'))
  writeStream.on('finish', ee.emit.bind(ee, 'editionFinish'))
  return writeStream
}

Container.prototype.publishContainer = function (path) {
  var writeStream = fs.createWriteStream(path)
    , urlStr = url.resolve(this.url, basename(path))

  this.obj.updated = new Date().toISOString()

  // Setting the link attribute's href
  this.obj.link._attr.href = urlStr

  writeStream.end(this.getXml(), 'utf8')
  return writeStream
}

Container.prototype.publish = function (path) {
  if (this.obj.entry.length === 0) return this.publishContainer(path)

  var ee = new EventEmitter()
    , editionsFinished = 1

  ee.on('editionFinish', function () {
    if (editionsFinished === this.obj.entry.length) {
      ee.emit('editionPublished')
    }
    editionsFinished += 1
  }.bind(this))

  this.obj.entry.forEach(this.publishEdition.bind(null, ee, path))

  ee.on('editionPublished', function () {
    var writeStream = this.publishContainer(path)

    writeStream.on('finish', ee.emit.bind(ee, 'finish'))
  }.bind(this))

  return ee
}

Container.prototype.add = function (edition) {
  this.obj.entry.push(edition)
}

Container.prototype.getXml = function () {
  var objectToExport = _.clone(this.obj)
  objectToExport.entry = _.map(objectToExport.entry, function (entry) {
    return _.omit(entry.object, 'published')
  })

  return data2xml('feed', objectToExport)
}
