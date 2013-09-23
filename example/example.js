var pugpig = require('../pugpig')
  , container = pugpig.container
  , edition = pugpig.edition
  , page = pugpig.page

var container1 = container(
    { title: 'test title'
    , image: 'image.jpg'
    , author: 'Dom Harrington'
    , key: 'tag:example.com,2013-09:books/first-book'
    })

var edit = edition(
    { title: 'test title'
    , summary: 'text summary'
    , author: 'Dom Harrington'
    , cover: 'image.jpg'
    , key: 'tag:example.com,2013-09:first-book'
    })

var page1 = page(
    { title: 'page 1'
    , html: '<h1>This is the first page</h1>'
    , category: 'introduction'
    , key: 'page1-id'
    })
  , page2 = page(
    { title: 'page 2'
    , html: '<h1>This is the second page</h1>'
    , category: 'introduction'
    , key: 'page2-id'
    })

// add pages to edition
edit.add(page1)
edit.add(page2)

// add edition to container
container1.add(edit)

// generates edition container contents
container1.publish('container.xml').on('finish', function () {
  console.log('Container published!')
})
