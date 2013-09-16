var pugpig = require('../pugpig')
  , editionContainer = pugpig.editionContainer
  , edition = pugpig.edition
  , editionPage = pugpig.editionPage

var container = editionContainer(
  { title: 'test title'
  , image: 'image.jpg'
  , author: 'Dom Harrington'
  })

var edit = edition(
  { title: 'test title'
  , summary: 'text summary'
  , author: 'Dom Harrington'
  , cover: 'image.jpg'
  })

var page = editionPage(
  { title: 'test title'
  , html: '<h1>Test HTML</h1>'
  , category: 'my great category'
  })

// add page to edition
edit.add(page)

edit.publish('test1.xml')

// add edition to container
container.add(edit)

// generates edition container contents
console.log(container.xml)
container.publish('container.xml')
