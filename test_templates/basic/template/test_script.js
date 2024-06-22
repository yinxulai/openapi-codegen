registerTemplateCommand('joinPath', function (args) {
  return args.join('/')
})

registerTemplateCommand('jsonStringify', function (data) {
  function sortJSON(data, order = 'asc') {
    // 判断数据类型
    if (typeof data !== 'object' || data === null) {
      return data
    }

    // 处理数组类型
    if (Array.isArray(data)) {
      return data.map(item => sortJSON(item, order))
    }

    // 处理对象类型
    return Object.keys(data).sort((a, b) => {
      let comparison = 0
      if (a > b) {
        comparison = 1
      } else if (a < b) {
        comparison = -1
      }
      return order === 'desc' ? comparison * -1 : comparison
    }).reduce((sortedObj, key) => {
      sortedObj[key] = sortJSON(data[key], order)
      return sortedObj
    }, {})
  }

  return JSON.stringify(sortJSON(data))
})
