module.exports = edition

// Omitting XML declaration for entries
var data2xml = require('data2xml')({ xmlDecl: false })
  , data2xmlWithXmlDecl = require('data2xml')()
  , fs = require('fs')

function edition(fields) {

  if (!fields) {
    fields = {}
  }

  var obj = {}

  if (fields.title) {
    obj.title = fields.title
  }

  if (fields.author) {
    obj.author =
      { name: fields.author
      }
  }

  if (fields.summary) {
    obj.summary = fields.summary
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

    writeStream.end(data2xmlWithXmlDecl('feed', contents), 'UTF-8')

    return writeStream
  }

  var pages = []

  /*
   * Adds an edition page to an edition. Does not
   * carry out validation on the page, this is to be
   * done by the edition page functions.
   */
  function add(edit) {
    pages.push(edit.object)
  }

  return {
      object: obj
    , publish: publish
    , add: add
    , pages: pages
    , get xml() { return getXml() }
  }
}
