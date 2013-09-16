module.exports.addFields = function (allowedFields, obj, fields) {
  Object.keys(fields).forEach(function (field) {
    if (allowedFields.indexOf(field) !== -1 && fields[field]) {
      obj[field] = fields[field]
    }
  })
}
