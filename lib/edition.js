module.exports = edition

// Omitting XML declaration for entries
var data2xml = require('data2xml')({ xmlDecl: false })
  , data2xmlWithXmlDecl = require('data2xml')()
  , fs = require('fs')
  , _ = require('lodash')
  , addFields = require('./utils').addFields
  , EventEmitter = require('events').EventEmitter

function edition(fields) {

  if (!fields) {
    fields = {}
  }

  var obj = {}

  addFields(['id', 'title', 'summary'], obj, fields)

  if (fields.author) {
    obj.author =
      { name: fields.author
      }
  }

  obj.link = []

  if (fields.cover) {
    obj.link.push(
      { _attr:
        { rel: 'http://opds-spec.org/image'
        , type: 'image/jpg'
        , href: fields.cover
        }
      })
  }

  function getXml() {
    return data2xml('entry', _.omit(obj, 'published'))
  }

  function publishEdition(path) {
    var writeStream = fs.createWriteStream(path)
      , contents =
        { _attr:
          { xmlns: 'http://www.w3.org/2005/Atom'
          , 'xmlns:app': 'http://www.w3.org/2007/app'
          }
        , entry: _.map(obj.pages, function (p) { return _.omit(p, 'publish') })
        }

    delete obj.pages

    obj.link.push(
      { _attr:
        { rel: 'alternate'
        , type: 'application/atom+xml'
        , href: path
        }
      })

    obj.link.push(
      { _attr:
        { rel: 'http://opds-spec.org/acquisition'
        , type: 'application/atom+xml'
        , href: path
        }
      })

    obj.updated = new Date().toISOString()
    obj.published = true

    contents = _.extend(_.pick(obj, 'title', 'summary', 'author', 'id'), contents)
    writeStream.end(data2xmlWithXmlDecl('feed', contents), 'UTF-8')

    return writeStream
  }

  function publishPage(ee, path, page) {
    var writeStream = page.publish(path)
    writeStream.on('finish', ee.emit.bind(ee, 'pageFinish'))
    return writeStream
  }

  /*
   * Returns a write stream to which outputs the data to
   * a file
   */
  function publish(path) {
    if (obj.pages.length === 0) return publishEdition(path)

    var ee = new EventEmitter()
      , pagesFinished = 1

    ee.on('pageFinish', function () {
      if (pagesFinished === obj.pages.length) {
        ee.emit('pagesPublished')
      }
      pagesFinished += 1
    })

    obj.pages.forEach(publishPage.bind(null, ee, path))

    ee.on('pagesPublished', function () {
      var writeStream = publishEdition(path)

      writeStream.on('finish', ee.emit.bind(ee, 'finish'))
    })

    return ee

  }

  obj.pages = []
  obj.published = false

  function add(edition) {
    obj.pages.push(edition)
  }

  return {
      object: obj
    , add: add
    , publish: publish
    , pages: obj.pages
    , get xml() { return getXml() }
    }
}
