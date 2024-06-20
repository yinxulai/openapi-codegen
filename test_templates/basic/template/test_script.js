registerTemplateCommand('joinPath', function (args) {
  return args.join('/')
})

registerTemplateCommand('throwEcho', function (data) {
  throw data
})

registerTemplateCommand('jsonStringify', function (data) {
  return JSON.stringify(data)
})
