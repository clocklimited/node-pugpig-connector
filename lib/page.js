module.exports = createPage

// Omitting XML declaration for pages
var data2xml = require('data2xml')({ xmlDecl: false })
  , _ = require('lodash')
  , addFields = require('./utils').addFields
  , join = require('path').join

function createPage(fields) {
  return new Page(fields)
}

function Page(fields) {
  if (!fields) fields = {}

  this.obj =
    { link: []
    , category: []
    }

  this.fields = fields
  this.html = ''

  addFields([ 'title' ], this.obj, fields)

  if (fields.key) this.obj.id = fields.key

  if (fields.html) this.html = fields.html

  if (fields.category) {
    this.obj.category.push(
      { _attr:
        { scheme: 'http://schema.pugpig.com/section'
        , term: fields.category
        }
      })
  }
  this.obj.category.push(
    { _attr:
      { scheme: 'http://schema.pugpig.com/pagetype'
      , term: 'article'
      }
    })

  Object.defineProperty(this, 'xml', { get: function () { return this.getXml() } })
  Object.defineProperty(this, 'object', { get: function () { return this.obj } })

  this.obj.published = false
}

Page.prototype.getXml = function () {
  return data2xml('entry', _.omit(this.obj, 'published'))
}

Page.prototype.publish = function (path) {
  // Updating published status
  this.obj.published = new Date().toISOString()

  // Updating updated status
  this.obj.updated = new Date().toISOString()

  var baseFilename = this.obj.id
    , htmlFilename = baseFilename + '.html'
    , manifestFilename = baseFilename + '.manifest'
    , htmlUrl = htmlFilename
    , manifestUrl = manifestFilename

  this.obj.link.push(
    { _attr:
      { rel: 'alternate'
      , type: 'text/html'
      , href: htmlUrl
      }
    })

  this.obj.link.push(
    { _attr:
      { rel: 'bookmark'
      , type: 'text/html'
      , href: htmlUrl
      }
    })

  this.obj.link.push(
    { _attr:
      { rel: 'related'
      , type: 'text/cache-manifest'
      , href: manifestUrl
      }
    })

  return {
      html:
      { file: htmlFilename
      , content: this.fields.html || ''
      }
    , manifest:
      { file: manifestFilename
      , content: 'CACHE MANIFEST'
      }
    }
}
