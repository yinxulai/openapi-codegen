registerTemplateCommand('throw', function (args) {
  throw Array.isArray(args) ? args.join(','): args
})
