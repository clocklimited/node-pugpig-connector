var pugpig = require('../pugpig')
  , editionContainer = pugpig.editionContainer
  , edition = pugpig.edition
  , editionPage = pugpig.editionPage

var container = editionContainer(
    { title: 'test title'
    , image: 'image.jpg'
    , author: 'Dom Harrington'
    , id: 'tag:example.com,2013-09:books/first-book'
    })

var edit = edition(
    { title: 'test title'
    , summary: 'text summary'
    , author: 'Dom Harrington'
    , cover: 'image.jpg'
    , id: 'tag:example.com,2013-09:first-book'
    })

var page1 = editionPage(
    { title: 'page 1'
    , html: '<h1>This is the first page</h1>'
    , category: 'introduction'
    , id: 'tag:example.com,2013-09:first-book:0'
    })
  , page2 = editionPage(
    { title: 'page 2'
    , html: '<h1>This is the second page</h1>'
    , category: 'introduction'
    , id: 'tag:example.com,2013-09:first-book:1'
    })

// add pages to edition
edit.add(page1)
edit.add(page2)

edit.publish('edition.xml')

// add edition to container
container.add(edit)

// generates edition container contents
container.publish('container.xml')
