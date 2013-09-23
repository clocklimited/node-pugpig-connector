module.exports = container

var data2xml = require('data2xml')()
  , fs = require('fs')
  , addFields = require('./utils').addFields
  , EventEmitter = require('events').EventEmitter
  , dirname = require('path').dirname
  , join = require('path').join
  , basename = require('path').basename
  , _ = require('lodash')
  , url = require('url')

function container(fields) {

  if (!fields) fields = {}

  var obj = {}

  obj.updated = null

  addFields(['title'], obj, fields)

  if (fields.key) obj.id = fields.key

  if (fields.author) {
    obj.author =
      { name: fields.author
      }
  }

  obj._attr =
    { xmlns: 'http://www.w3.org/2005/Atom'
    , 'xmlns:dcterms': 'http://purl.org/dc/terms/'
    , 'xmlns:opds': 'http://opds-spec.org/2010/catalog'
    }

  obj.entry = []

  function publishEdition(ee, path, edition) {
    var writeStream = edition.publish(join(dirname(path), edition.object.id + '-atom.xml'))
    writeStream.on('finish', ee.emit.bind(ee, 'editionFinish'))
    return writeStream
  }

  function publishContainer(path) {
    var writeStream = fs.createWriteStream(path)
      , urlStr = fields.url ? url.resolve(fields.url, basename(path)) : path

    obj.updated = new Date().toISOString()

    obj.link =
      { _attr:
        { rel: 'self'
        , href: urlStr
        }
      }

    writeStream.end(getXml(), 'utf8')
    return writeStream
  }

  /*
   * This function is intended to carry out validation
   * of the attributes and data that has been passed in.
   *
   * Returns a write stream to which outputs the data to
   * a file
   */
  function publish(path) {
    if (obj.entry.length === 0) return publishContainer(path)

    var ee = new EventEmitter()
      , editionsFinished = 1

    ee.on('editionFinish', function () {
      if (editionsFinished === obj.entry.length) {
        ee.emit('editionPublished')
      }
      editionsFinished += 1
    })

    obj.entry.forEach(publishEdition.bind(null, ee, path))

    ee.on('editionPublished', function () {
      var writeStream = publishContainer(path)

      writeStream.on('finish', ee.emit.bind(ee, 'finish'))
    })

    return ee
  }

  /*
   * Adds an edition to an edition container. Does not
   * carry out validation on the edition, this is to be
   * done by the edition functions.
   */
  function add(edition) {
    obj.entry.push(edition)
  }

  function getXml() {
    var objectToExport = _.clone(obj)
    objectToExport.entry = _.map(objectToExport.entry, 'object')

    return data2xml('feed', objectToExport)
  }

  return {
      object: obj
    , add: add
    , publish: publish
    , get xml() { return getXml() }
    }
}
