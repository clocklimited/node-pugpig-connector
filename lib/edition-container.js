module.exports = editionContainer

var data2xml = require('data2xml')()
  , fs = require('fs')

function editionContainer(fields) {

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

  obj._attr =
    { xmlns: 'http://www.w3.org/2005/Atom'
    , 'xmlns:dcterms': 'http://purl.org/dc/terms/'
    , 'xmlns:opds': 'http://opds-spec.org/2010/catalog'
    }

  obj.entry =  []

  /*
   * This function is intended to carry out validation
   * of the attributes and data that has been passed in.
   *
   * Returns a write stream to which outputs the data to
   * a file
   */
  function publish(path) {
    var writeStream = fs.createWriteStream(path)
    obj.updated = new Date().toISOString()
    writeStream.end(getXml(), 'UTF-8')
    return writeStream
  }

  /*
   * Adds an edition to an edition container. Does not
   * carry out validation on the edition, this is to be
   * done by the edition functions.
   */
  function add(edition) {
    obj.entry.push(edition.object)
  }

  function getXml() {
    return data2xml('feed', obj)
  }

  return {
      object: obj
    , publish: publish
    , add: add
    , get xml() { return getXml() }
  }
}
