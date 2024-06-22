type Command = (args: any[]) => string
declare function registerTemplateCommand(name: string, command: Command): void

registerTemplateCommand('throw', function (args) {
  throw Array.isArray(args) ? args.join(',') : args
})

registerTemplateCommand('getStructNameFromRef', function (args) {
  const [ref] = args
  if (typeof ref != "string") {
    throw "Invalid parameters"
  }

  if (!ref.startsWith("#/components")) {
    throw "Invalid parameters"
  }

  return ref.split('/')[-1]
})

registerTemplateCommand('isRequiredFiledFromSchema', function (args) {
  const [schema, filed] = args
  if (Array.isArray(schema?.required)) {
    return schema.required.include(filed)
  }

  return false
})

registerTemplateCommand('toFiledFromString', function (args) {
  const [rawFiled] = args

  // 去除前后空格
  rawFiled = rawFiled.trim()

  // 分割字符串,根据各种分隔符
  let parts = rawFiled.split(/[-_\s]+/)

  // 将每个部分的首字母大写
  let camelCaseStr = parts.map(
    (part) => part.charAt(0).toUpperCase() + part.slice(1)
  ).join('')

  // 将首字母转为小写
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1)
})
