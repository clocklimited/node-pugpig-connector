module.exports = editionPage

// Omitting XML declaration for entries
var data2xml = require('data2xml')({ xmlDecl: false })
  , fs = require('fs')
  , slug = require('slugg')
  , EventEmitter = require('events').EventEmitter

function editionPage(fields) {

  if (!fields) {
    fields = {}
  }

  var obj =
    { link: []
    }
    , html = ''

  if (fields.title) {
    obj.title = fields.title
  }

  if (fields.html) {
    html = fields.html
  }

  if (fields.category) {
    obj.category =
      { _attr:
        { scheme: 'http://schema.pugpig.com/section'
        , term: fields.category
        }
      }
  }

  function getXml() {
    return data2xml('entry', obj)
  }

  /*
   * Publishes the contents of the page to disk, takes the HTML string and
   * outputs to file. Analyses the HTML for assets and outputs these to a cache
   * manifest also.
   *
   * Creates (and returns) an event emitter which emits a finish event when
   * both files (HTML and manifest) have been written to disk.
   *
   */
  function publish() {
    if (!obj.title) {
      throw new Error('No page title')
    }

    var ee = new EventEmitter()
      , filesFinished = 0

    ee.on('fileFinish', function () {
      filesFinished += 1
      if (filesFinished === 2) {
        ee.emit('finish')
      }
    })

    function triggerFileFinish() {
      ee.emit('fileFinish')
    }

    // TODO come up with a better way to deduce html + manifest file names
    // this is fraught with error if 2 pages have the same title
    var htmlWriteStream = fs.createWriteStream(slug(obj.title) + '.html')
    htmlWriteStream.on('finish', triggerFileFinish)
    htmlWriteStream.end(fields.html, 'UTF-8')

    var manifestWriteStream = fs.createWriteStream(slug(obj.title) + '.manifest')
    manifestWriteStream.on('finish', triggerFileFinish)
    // TODO need to work out best way of obtaining cache manifest from a HTML
    // file
    manifestWriteStream.end('CACHE MANIFEST', 'UTF-8')

    return ee
  }

  return {
      object: obj
    , html: html
    , publish: publish
    , get xml() { return getXml() }
  }
}
