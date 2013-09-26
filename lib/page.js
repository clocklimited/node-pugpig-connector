module.exports = page

// Omitting XML declaration for pages
var data2xml = require('data2xml')({ xmlDecl: false })
  , fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , _ = require('lodash')
  , addFields = require('./utils').addFields
  , basename = require('path').basename
  , url = require('url')

function page(fields) {

  if (!fields)fields = {}

  var obj =
    { link: []
    }
    , html = ''

  addFields(['title'], obj, fields)

  if (fields.key) obj.id = fields.key

  if (fields.html) html = fields.html

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

  function publish(path) {
    // Updating published status
    obj.published = new Date().toISOString()

    // Updating updated status
    obj.updated = new Date().toISOString()

    var ee = new EventEmitter()
      , filesFinished = 0
      , htmlFilename = path + '.html'
      , manifestFilename = path + '.manifest'
      , urlStr = fields.url ? fields.url + '/' + basename(path) + '.html' : path
      , urlPath = fields.url ? url.parse(fields.url).pathname + '/' : ''

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
    htmlWriteStream.end(fields.html, 'utf8')

    var manifestWriteStream = fs.createWriteStream(manifestFilename)
    manifestWriteStream.on('finish', triggerFileFinish)
    // TODO need to work out best way of obtaining cache manifest from a HTML
    // file
    manifestWriteStream.end('CACHE MANIFEST', 'utf8')

    obj.link.push(
      { _attr:
        { rel: 'alternate'
        , type: 'text/html'
        , href: urlPath + basename(htmlFilename)
        }
      })

    obj.link.push(
      { _attr:
        { rel: 'bookmark'
        , type: 'text/html'
        , href: urlStr
        }
      })

    obj.link.push(
      { _attr:
        { rel: 'related'
        , type: 'text/cache-manifest'
        , href: urlPath + basename(manifestFilename)
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
