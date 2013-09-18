module.exports = edition

// Omitting XML declaration for entries
var data2xml = require('data2xml')({ xmlDecl: false })
  , data2xmlWithXmlDecl = require('data2xml')()
  , fs = require('fs')
  , _ = require('lodash')
  , addFields = require('./utils').addFields

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
    return data2xml('entry', obj)
  }

  /*
   * Returns a write stream to which outputs the data to
   * a file
   */
  function publish(path) {
    var writeStream = fs.createWriteStream(path)
      , contents =
        { _attr:
          { xmlns: 'http://www.w3.org/2005/Atom'
          , 'xmlns:app': 'http://www.w3.org/2007/app'
          }
        , entry: pages
        }

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

    contents = _.extend(_.pick(obj, 'title', 'summary', 'author', 'id'), contents)
    writeStream.end(data2xmlWithXmlDecl('feed', contents), 'UTF-8')

    return writeStream
  }

  var pages = []

  return {
      object: obj
    , publish: publish
    , pages: pages
    , get xml() { return getXml() }
    }
}
