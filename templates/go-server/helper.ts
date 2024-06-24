function toFieldNames(value: string, isPublic = true): string {
  // 去除前后空格
  value = value.trim()

  // 分割字符串,根据各种分隔符
  const parts = value.split(/[-_\s]+/)

  // 将每个部分的首字母大写
  let camelCaseStr = parts.map(
    (part) => part.charAt(0).toUpperCase() + part.slice(1)
  ).join('')

  return isPublic
    ? camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1)
    : camelCaseStr.charAt(0).toLowerCase() + camelCaseStr.slice(1)
}

function isReferenceObject(schema: unknown): schema is ReferenceObject {
  return schema != null && typeof schema === 'object' && '$ref' in schema
}

function isArraySchemaObject(schema: unknown): schema is ArraySchemaObject {
  return schema != null
    && typeof schema === 'object'
    && 'items' in schema
    && 'type' in schema
    && schema.type === 'array'
}

function isNonArraySchemaObject(schema: unknown): schema is NonArraySchemaObject {
  return schema != null
    && typeof schema === 'object'
    && 'type' in schema
    && schema.type !== 'array'
}

function schemaObjectToStruct(schema: SchemaObject | ReferenceObject): string {
  if (isReferenceObject(schema)) {
    // #components/xxxx/name
    const stmts = schema.$ref.split('/')
    return stmts[stmts.length - 1]
  }

  if (isArraySchemaObject(schema)) {
    return `[]${schemaObjectToStruct(schema.items)}`
  }

  if (isNonArraySchemaObject(schema) && schema.type === 'object') {
    const codeLines: string[] = []
    codeLines.push(`struct {`)
    if (schema.properties) {
      for (const key in schema.properties) {
        const property = schema.properties[key]
        const isRequired = schema.required?.includes(key) || false
        codeLines.push(`  ${toFieldNames(key)} ${isRequired ? '*' : ''}${schemaObjectToStruct(property)}`)
      }
    }
    codeLines.push('}')
    return codeLines.join('\n')
  }

  if (schema.type === 'string') {
    return 'string'
  }

  if (schema.type === 'boolean') {
    return 'bool'
  }

  if (schema.type === 'integer') {
    if (schema.format === 'int32') {
      return 'int32'
    }
    if (schema.format === 'int64') {
      return 'int32'
    }
    return 'int32'
  }

  if (schema.type === 'number') {
    if (schema.format === 'float') {
      return 'float64'
    }
    if (schema.format === 'double') {
      return 'float64'
    }

    return 'float64'
  }

  throw 'unsupported schema type'
}

function OperationObjectToRequestStruct(schema: OperationObject): string {
  const codeLines: string[] = [`struct {`]

  if (schema.parameters) {
    const structFieldsMap = new Map<ParameterInType, string[]>()

    for (const key in schema.parameters) {
      const parameter = schema.parameters[key]
      if (isReferenceObject(parameter)) {
        const stmts = parameter.$ref.split('/')
        return stmts[stmts.length - 1]
      }

      if (parameter.schema) {
        const struct = schemaObjectToStruct(parameter.schema)
        const required = parameter.required == true ? '*' : ''
        const fields = structFieldsMap.get(parameter.in) || []
        fields.push(`${parameter.name} ${required}${struct}`)
        structFieldsMap.set(parameter.in, fields)
      }

      if (parameter.content) {
        throw 'unsupported parameter type'
      }

    }

    for (const [inType, fields] of structFieldsMap.entries()) {
      if (fields && fields.length > 0) {
        codeLines.push(`${inType} struct {`)
        for (const field of fields) {
          // TODO sort
          codeLines.push(field)
        }
        codeLines.push('}')
      }
    }
  }

  if (schema.requestBody) {
    if (isReferenceObject(schema.requestBody)) {
      const stmts = schema.requestBody.$ref.split('/')
      codeLines.push(`body ${stmts[stmts.length - 1]}`)
    } else {
      if (Object.keys(schema.requestBody.content).length != 1) {
        throw 'unsupported'
      }

      const body = schema.requestBody.content[0]

      if (body.schema == null) {
        throw 'unsupported'
      }

      const required = schema.requestBody.required ? '*' : ''
      codeLines.push(`body ${required}${schemaObjectToStruct(body.schema)}`)
    }
  }

  codeLines.push('}')
  return codeLines.join('\n')
}

function OperationObjectToResponseStruct(schema: OperationObject): string {
  const codeLines: string[] = [`struct {`]

  for (const key in schema.responses) {
    const response = schema.responses[key]
    if (key.toLowerCase() === 'default') {
      codeLines.push(`default ${}`)

    } else {

    }
  }


  return ''
}

registerTemplateCommand('checkSupportedVersion', (args: [Document]): string => {
  const [doc] = args
  if (doc.openapi !== '3.0.0') {
    throw 'unsupported openapi version: ' + doc.openapi
  }

  return ''
})

registerTemplateCommand('test', (args: [SchemaObject, string]): string => {
  const [schema, name] = args

  if (isArraySchemaObject(schema)) {
    return `type ${toFieldNames(name)} = ${schemaObjectToStruct(schema)}`
  }

  if (isNonArraySchemaObject(schema)) {
    return `type ${toFieldNames(name)} = ${schemaObjectToStruct(schema)}`
  }

  if (isReferenceObject(schema)) {
    return `type ${toFieldNames(name)} = ${schemaObjectToStruct(schema)}`
  }

  throw 'unsupported schema type'
})

// copy from https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md

interface Document<T extends {} = {}> {
  openapi: string
  info: InfoObject
  servers?: ServerObject[]
  paths: PathsObject<T>
  components?: ComponentsObject
  security?: SecurityRequirementObject[]
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
}

interface InfoObject {
  title: string
  description?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
  version: string
}

interface ContactObject {
  name?: string
  url?: string
  email?: string
}

interface LicenseObject {
  name: string
  url?: string
}

interface ServerObject {
  url: string
  description?: string
  variables?: { [variable: string]: ServerVariableObject }
}

interface ServerVariableObject {
  enum?: string[] | number[]
  default: string | number
  description?: string
}

interface PathsObject<T extends {} = {}, P extends {} = {}> {
  [pattern: string]: (PathItemObject<T> & P) | undefined
}

// All HTTP methods allowed by OpenAPI 3 spec
// See https://swagger.io/specification/#path-item-object
// You can use keys or values from it in TypeScript code like this:
//     for (const method of Object.values(HttpMethods)) { … }
enum HttpMethods {
  GET = 'get',
  PUT = 'put',
  POST = 'post',
  DELETE = 'delete',
  OPTIONS = 'options',
  HEAD = 'head',
  PATCH = 'patch',
  TRACE = 'trace',
}

export type PathItemObject<T extends {} = {}> = {
  $ref?: string
  summary?: string
  description?: string
  servers?: ServerObject[]
  parameters?: (ReferenceObject | ParameterObject)[]
} & {
    [method in HttpMethods]?: OperationObject<T>
  }

export type OperationObject<T extends {} = {}> = {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  operationId?: string
  parameters?: (ReferenceObject | ParameterObject)[]
  requestBody?: ReferenceObject | RequestBodyObject
  responses: ResponsesObject
  callbacks?: { [callback: string]: ReferenceObject | CallbackObject }
  deprecated?: boolean
  security?: SecurityRequirementObject[]
  servers?: ServerObject[]
} & T

interface ExternalDocumentationObject {
  description?: string
  url: string
}

type ParameterInType = 'path' | 'query' | 'header' | 'cookie'

interface ParameterObject extends ParameterBaseObject {
  name: string
  in: ParameterInType
}

interface HeaderObject extends ParameterBaseObject {}

interface ParameterBaseObject {
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: ReferenceObject | SchemaObject
  example?: any
  examples?: { [media: string]: ReferenceObject | ExampleObject }
  content?: { [media: string]: MediaTypeObject }
}

export type NonArraySchemaObjectType =
  | 'boolean'
  | 'object'
  | 'number'
  | 'string'
  | 'integer'
export type ArraySchemaObjectType = 'array'
export type SchemaObject = ArraySchemaObject | NonArraySchemaObject

interface ArraySchemaObject extends BaseSchemaObject {
  type: ArraySchemaObjectType
  items: ReferenceObject | SchemaObject
}

interface NonArraySchemaObject extends BaseSchemaObject {
  type?: NonArraySchemaObjectType
}

interface BaseSchemaObject {
  // JSON schema allowed properties, adjusted for OpenAPI
  title?: string
  description?: string
  format?: string
  default?: any
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  additionalProperties?: boolean | ReferenceObject | SchemaObject
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  enum?: any[]
  properties?: {
    [name: string]: ReferenceObject | SchemaObject
  }
  allOf?: (ReferenceObject | SchemaObject)[]
  oneOf?: (ReferenceObject | SchemaObject)[]
  anyOf?: (ReferenceObject | SchemaObject)[]
  not?: ReferenceObject | SchemaObject

  // OpenAPI-specific properties
  nullable?: boolean
  discriminator?: DiscriminatorObject
  readOnly?: boolean
  writeOnly?: boolean
  xml?: XMLObject
  externalDocs?: ExternalDocumentationObject
  example?: any
  deprecated?: boolean
}

interface DiscriminatorObject {
  propertyName: string
  mapping?: { [value: string]: string }
}

interface XMLObject {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
}

interface ReferenceObject {
  $ref: string
}

interface ExampleObject {
  summary?: string
  description?: string
  value?: any
  externalValue?: string
}

interface MediaTypeObject {
  schema?: ReferenceObject | SchemaObject
  example?: any
  examples?: { [media: string]: ReferenceObject | ExampleObject }
  encoding?: { [media: string]: EncodingObject }
}

interface EncodingObject {
  contentType?: string
  headers?: { [header: string]: ReferenceObject | HeaderObject }
  style?: string
  explode?: boolean
  allowReserved?: boolean
}

interface RequestBodyObject {
  description?: string
  content: { [media: string]: MediaTypeObject }
  required?: boolean
}

interface ResponsesObject {
  [code: string]: ReferenceObject | ResponseObject
}

interface ResponseObject {
  description: string
  headers?: { [header: string]: ReferenceObject | HeaderObject }
  content?: { [media: string]: MediaTypeObject }
  links?: { [link: string]: ReferenceObject | LinkObject }
}

interface LinkObject {
  operationRef?: string
  operationId?: string
  parameters?: { [parameter: string]: any }
  requestBody?: any
  description?: string
  server?: ServerObject
}

interface CallbackObject {
  [url: string]: PathItemObject
}

interface SecurityRequirementObject {
  [name: string]: string[]
}

interface ComponentsObject {
  schemas?: { [key: string]: ReferenceObject | SchemaObject }
  responses?: { [key: string]: ReferenceObject | ResponseObject }
  parameters?: { [key: string]: ReferenceObject | ParameterObject }
  examples?: { [key: string]: ReferenceObject | ExampleObject }
  requestBodies?: { [key: string]: ReferenceObject | RequestBodyObject }
  headers?: { [key: string]: ReferenceObject | HeaderObject }
  securitySchemes?: { [key: string]: ReferenceObject | SecuritySchemeObject }
  links?: { [key: string]: ReferenceObject | LinkObject }
  callbacks?: { [key: string]: ReferenceObject | CallbackObject }
}

export type SecuritySchemeObject =
  | HttpSecurityScheme
  | ApiKeySecurityScheme
  | OAuth2SecurityScheme
  | OpenIdSecurityScheme

interface HttpSecurityScheme {
  type: 'http'
  description?: string
  scheme: string
  bearerFormat?: string
}

interface ApiKeySecurityScheme {
  type: 'apiKey'
  description?: string
  name: string
  in: string
}

interface OAuth2SecurityScheme {
  type: 'oauth2'
  description?: string
  flows: {
    implicit?: {
      authorizationUrl: string
      refreshUrl?: string
      scopes: { [scope: string]: string }
    }
    password?: {
      tokenUrl: string
      refreshUrl?: string
      scopes: { [scope: string]: string }
    }
    clientCredentials?: {
      tokenUrl: string
      refreshUrl?: string
      scopes: { [scope: string]: string }
    }
    authorizationCode?: {
      authorizationUrl: string
      tokenUrl: string
      refreshUrl?: string
      scopes: { [scope: string]: string }
    }
  }
}

interface OpenIdSecurityScheme {
  type: 'openIdConnect'
  description?: string
  openIdConnectUrl: string
}

interface TagObject {
  name: string
  description?: string
  externalDocs?: ExternalDocumentationObject
}
