var pugpig
describe('pugpig main file', function () {
  it('can be required', function () {
    (function () {
      pugpig = require('../')
    }).should.not.throwError()
  })

  describe('container', function () {
    it('should be a function', function () {
      pugpig.container.should.be.a('function')
    })
  })

  describe('edition', function () {
    it('should be a function', function () {
      pugpig.edition.should.be.a('function')
    })
  })

  describe('page', function () {
    it('should be a function', function () {
      pugpig.page.should.be.a('function')
    })
  })
})
