module.exports = createEdition

// Omitting XML declaration for entries
var data2xml = require('data2xml')({ xmlDecl: false })
  , data2xmlWithXmlDecl = require('data2xml')()
  , _ = require('lodash')
  , addFields = require('./utils').addFields
  , url = require('url')
  , basename = require('path').basename

function createEdition(fields) {
  return new Edition(fields)
}

function Edition(fields) {
  if (!fields) fields = {}

  this.obj = {}
  this.fields = fields

  addFields(['title', 'summary'], this.obj, fields)

  if (fields.key) this.obj.id = fields.key

  if (fields.author) {
    this.obj.author =
      { name: fields.author
      }
  }

  this.obj.link = []

  if (fields.cover) {
    this.obj.link.push(
      { _attr:
        { rel: 'http://opds-spec.org/image'
        , type: 'image/jpg'
        , href: fields.cover
        }
      })
  }

  this.obj.pages = []
  this.obj.published = false

  Object.defineProperty(this, 'xml', { get: function () { return this.getXml() }})
  Object.defineProperty(this, 'object', { get: function () { return this.obj }})
  Object.defineProperty(this, 'pages', { get: function () { return this.obj.pages }})
}

Edition.prototype.getXml = function () {
  return data2xml('entry', _.omit(this.obj, 'published'))
};

Edition.prototype.publishEdition = function (path) {
  var urlStr = this.fields.url ? url.resolve(this.fields.url, basename(path)) : path
    , relativeUrl = this.fields.url ? url.parse(this.fields.url).pathname + '/' + basename(path) : path
    , contents =
      { _attr:
        { xmlns: 'http://www.w3.org/2005/Atom'
        , 'xmlns:app': 'http://www.w3.org/2007/app'
        }
      , entry: _.map(this.obj.pages, function (p) { return p.object })
      , link:
        [{ _attr:
          { rel: 'self'
          , href: urlStr
          }
        }]
      }

  delete this.obj.pages

  this.obj.link.push(
    { _attr:
      { rel: 'alternate'
      , type: 'application/atom+xml'
      , href: relativeUrl
      }
    })

  this.obj.link.push(
    { _attr:
      { rel: 'http://opds-spec.org/acquisition'
      , type: 'application/atom+xml'
      , href: relativeUrl
      }
    })

  this.obj.updated = new Date().toISOString()
  this.obj.published = true

  contents.link.push(this.obj.link)

  contents = _.extend(_.pick(this.obj, 'title', 'summary', 'author', 'id'), contents)
  return data2xmlWithXmlDecl('feed', contents)
}

Edition.prototype.publishPage = function (path, page) {
  return page.publish(path)
}

Edition.prototype.publish = function (path) {
  var pages = this.obj.pages.map(this.publishPage.bind(null, path))

  return { file: path, xml: this.publishEdition(path), pages: pages }
}

Edition.prototype.add = function (edition) {
  this.obj.pages.push(edition)
}
