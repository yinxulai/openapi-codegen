# openapi-codegen

openapi 代码生成器

## 能力

- [x] 解析和加载 openapi 格式文件
- [x] 支持自定义模渲染板（基于 go/template）
- [x] 支持通过 JavaScript 自定义模板脚本命令
- [ ] 支持通过 TypeScript 自定义模板脚本命令

## 使用

### 安装

```bash
go install github.com/yinxulai/openapi-codegen@latest
```

### 生成代码

```bash
openapi-codegen -t {template_path} -f {openapi_file} -o {generated_code_path}
```

### 官方模板

TODO

### 编写模板

每个目录代表一个模板，你只需要创建一个文件夹，然后往里面添加你的模板文件和脚本文件即可。

### 模板编写指南

#### 基本原则

为了保证生成的代码好用，我们有一些建议：

- 生成的代码项目文件应该尽可能聚合，尽量避免一大堆文件，在语言风格允许的情况下，只生成一个文件是最好的，因为用户使用起来最方便。
- 应该绝对避免用户需要对生成的代码进行修改，所以，你应该充分考虑接口设计，将需要实现的部分以接口的方式向外提供，比如通过一个 `CreateServer` 方法，将实现通过参数传入。

#### 渲染流程

了解渲染流程对编写模板很有帮助，openapi-codegen 首先会扫描模板目录下的所有脚本文件并加载，然后扫描所有的模板文件，并将 openapi 数据应用到每个模板文件中进行渲染。

#### 模板与生成文件之间的关系

模板与生成文件之间的关系通过文件名与路径来控制，例如以下的数据结构：

```ls
├── subdir
│   └── test_template.go.tmpl
├── test_script.js
└── test_template.go.tmpl
```

生成的对应项目结构：

```ls
├── subdir
│   └── test_template.go
└── test_template.go
```

基本上我们将模板和生成项目的目录结构保持一一对应关系，生成的结果文件名称是由对应的模板名称去除 `.tmpl` 后缀来确定的。

## 与其他代码生成器的不同

### 直接将 `openapi` 原始结构用于渲染

`openapi` 是一个稳定且标准的规范，因此我认为直接将 `openapi` 原始结构直接用于模板渲染是最好的选择，而不是额外创造一些其他的通用结构来使用，
这减少了一次学习的成本。

### 支持自定义渲染脚本

很多其他生成器之所以设计了额外的数据结构用于模板渲染，很大一个原因在于他们需要通过这种方式扩展特定模板生成所需的字段，它们普遍选择了在生成器中准备好一切数据，然后使用一个简单的模板渲染库来完成代码的生成，这造成了两个问题：

- 灵活度大大降低，很多时候你没有办法仅仅通过更改模板来完成你的目标，你必须去修改生成器的源码
- 提交到模板中的渲染数据非常的庞大，这让编写调试模板变得很痛苦！

#### 加入自定义模板脚本

通过加入自定义的模板脚本，我们支持通过 `JavaScript` 来创建可以直接用于模板的处理方法，就像这样：

1. 在你的模板中创建一个 `js` 文件，然后写入如下内容来向模板注册一个 `joinPath` 的命令。

```js
// file: template_path/*.js
registerTemplateCommand('joinPath', function (args) {
  return args.join('/')
})
```

2. 在你的模板中使用它

```tmpl
// file: template_path/*.txt.tmpl
// content: {{ .openapi | joinPath version }}

// output file: template_path/*.txt
// content: version/3.0.1
```

通过自定义渲染脚本，你可以解决任何语言时所需要的特殊数据，这些东西与模板放在一起即可，不需要改动生成器。
