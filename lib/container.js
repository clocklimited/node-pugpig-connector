module.exports = createContainer

var data2xml = require('data2xml')()
  , addFields = require('./utils').addFields
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

Container.prototype.publishEdition = function (path, edition) {
  return edition.publish(join(dirname(path), edition.object.id + '-atom.xml'))
}

Container.prototype.publishContainer = function (path) {
  var urlStr = url.resolve(this.url, basename(path))

  this.obj.updated = new Date().toISOString()

  // Setting the link attribute's href
  this.obj.link._attr.href = urlStr

  return this.getXml()
}

Container.prototype.publish = function (path) {
  var editions = this.obj.entry.map(this.publishEdition.bind(null, path))

  return { file: path, xml: this.publishContainer(path), editions: editions }
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
