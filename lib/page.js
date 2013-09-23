module.exports = page

// Omitting XML declaration for pages
var data2xml = require('data2xml')({ xmlDecl: false })
  , fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , _ = require('lodash')
  , addFields = require('./utils').addFields
  , dirname = require('path').dirname
  , join = require('path').join

function page(fields) {

  if (!fields) {
    fields = {}
  }

  var obj =
    { link: []
    }
    , html = ''

  addFields(['key', 'title'], obj, fields)

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
    return data2xml('entry', _.omit(obj, 'published'))
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
  function publish(path) {
    path = dirname(path || '')
    // Updating published status
    obj.published = new Date().toISOString()

    // Updating updated status
    obj.updated = new Date().toISOString()

    var ee = new EventEmitter()
      , filesFinished = 0
      , htmlFilename = join(path, baseFilename + '.html')
      , manifestFilename = join(path, baseFilename + '.manifest')

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
    var htmlWriteStream = fs.createWriteStream(htmlFilename)
    htmlWriteStream.on('finish', triggerFileFinish)
    htmlWriteStream.end(fields.html, 'UTF-8')

    var manifestWriteStream = fs.createWriteStream(manifestFilename)
    manifestWriteStream.on('finish', triggerFileFinish)
    // TODO need to work out best way of obtaining cache manifest from a HTML
    // file
    manifestWriteStream.end('CACHE MANIFEST', 'UTF-8')

    obj.link.push(
      { _attr:
        { rel: 'alternate'
        , type: 'text/html'
        , href: htmlFilename
        }
      })

    // TODO this should include an absolute link to this resource
    obj.link.push(
      { _attr:
        { rel: 'bookmark'
        , type: 'text/html'
        , href: htmlFilename
        }
      })

    obj.link.push(
      { _attr:
        { rel: 'related'
        , type: 'text/cache-manifest'
        , href: manifestFilename
        }
      })

    return ee
  }

  obj.published = false

  return {
      object: obj
    , html: html
    , publish: publish
    , get xml() { return getXml() }
    }
}
