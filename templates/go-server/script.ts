import '../../runtime.d.ts'

function normalizeFieldNames(value: string, isPublic = true): string {
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

function isReferenceObject(schema: unknown): schema is OpenAPIV3.ReferenceObject {
  return schema != null && typeof schema === 'object' && '$ref' in schema
}

function isArraySchemaObject(schema: unknown): schema is OpenAPIV3.ArraySchemaObject {
  return schema != null
    && typeof schema === 'object'
    && 'items' in schema
    && 'type' in schema
    && schema.type === 'array'
}

function isNonArraySchemaObject(schema: unknown): schema is OpenAPIV3.NonArraySchemaObject {
  return schema != null
    && typeof schema === 'object'
    && 'type' in schema
    && schema.type !== 'array'
}

registerTemplateCommand('checkSupportedVersion', (args: [OpenAPIV3.Document]): string => {
  const [doc] = args
  if (doc.openapi !== '3.0.0') {
    throw 'unsupported openapi version: ' + doc.openapi
  }

  return ''
})

registerTemplateCommand('refToStruct', (args: [OpenAPIV3.ReferenceObject, string]): string => {
  const [ref, name] = args

  const componentName = ref.$ref.split('/')[-1]

  return [
    `type ${normalizeFieldNames(name)} = ${normalizeFieldNames(componentName)}`
  ].join('\n')
})

registerTemplateCommand('schemaObjectToStruct', (args: [OpenAPIV3.SchemaObject, string]): string => {
  const [schema, name] = args
  const codeLines: string[] = []

  if (schema.type === 'array') {
    throw 'array is not supported'
  }

  if (Array.isArray(schema.enum)) {
    codeLines.push(`const (`)
    for (const enumItem of schema.enum) {
      if (schema.type == "string") {
        codeLines.push(`  ${normalizeFieldNames(name)} = "${enumItem}"`)
      } else {
        throw 'enum type is not supported'
      }
    }

    codeLines.push(`)`)
    return codeLines.join('\n')
  }

  if (schema.type === 'object') {
    codeLines.push(`type ${normalizeFieldNames(name)} struct {`)

    if (schema.properties) {
      for (const key in schema.properties) {
        const property = schema.properties[key]
        codeLines.push(`  ${normalizeFieldNames(key)} ${normalizeFieldNames(property)}`)
      }
    }

    schema.properties

    codeLines.push(`type ${normalizeFieldNames(name)} = string`)
  }

  return codeLines.join('\n')
})

// copy from https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md
export namespace OpenAPIV3 {
  export interface Document<T extends {} = {}> {
    openapi: string
    info: InfoObject
    servers?: ServerObject[]
    paths: PathsObject<T>
    components?: ComponentsObject
    security?: SecurityRequirementObject[]
    tags?: TagObject[]
    externalDocs?: ExternalDocumentationObject
  }

  export interface InfoObject {
    title: string
    description?: string
    termsOfService?: string
    contact?: ContactObject
    license?: LicenseObject
    version: string
  }

  export interface ContactObject {
    name?: string
    url?: string
    email?: string
  }

  export interface LicenseObject {
    name: string
    url?: string
  }

  export interface ServerObject {
    url: string
    description?: string
    variables?: { [variable: string]: ServerVariableObject }
  }

  export interface ServerVariableObject {
    enum?: string[] | number[]
    default: string | number
    description?: string
  }

  export interface PathsObject<T extends {} = {}, P extends {} = {}> {
    [pattern: string]: (PathItemObject<T> & P) | undefined
  }

  // All HTTP methods allowed by OpenAPI 3 spec
  // See https://swagger.io/specification/#path-item-object
  // You can use keys or values from it in TypeScript code like this:
  //     for (const method of Object.values(OpenAPIV3.HttpMethods)) { … }
  export enum HttpMethods {
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

  export interface ExternalDocumentationObject {
    description?: string
    url: string
  }

  export interface ParameterObject extends ParameterBaseObject {
    name: string
    in: string
  }

  export interface HeaderObject extends ParameterBaseObject {}

  export interface ParameterBaseObject {
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

  export interface ArraySchemaObject extends BaseSchemaObject {
    type: ArraySchemaObjectType
    items: ReferenceObject | SchemaObject
  }

  export interface NonArraySchemaObject extends BaseSchemaObject {
    type?: NonArraySchemaObjectType
  }

  export interface BaseSchemaObject {
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

  export interface DiscriminatorObject {
    propertyName: string
    mapping?: { [value: string]: string }
  }

  export interface XMLObject {
    name?: string
    namespace?: string
    prefix?: string
    attribute?: boolean
    wrapped?: boolean
  }

  export interface ReferenceObject {
    $ref: string
  }

  export interface ExampleObject {
    summary?: string
    description?: string
    value?: any
    externalValue?: string
  }

  export interface MediaTypeObject {
    schema?: ReferenceObject | SchemaObject
    example?: any
    examples?: { [media: string]: ReferenceObject | ExampleObject }
    encoding?: { [media: string]: EncodingObject }
  }

  export interface EncodingObject {
    contentType?: string
    headers?: { [header: string]: ReferenceObject | HeaderObject }
    style?: string
    explode?: boolean
    allowReserved?: boolean
  }

  export interface RequestBodyObject {
    description?: string
    content: { [media: string]: MediaTypeObject }
    required?: boolean
  }

  export interface ResponsesObject {
    [code: string]: ReferenceObject | ResponseObject
  }

  export interface ResponseObject {
    description: string
    headers?: { [header: string]: ReferenceObject | HeaderObject }
    content?: { [media: string]: MediaTypeObject }
    links?: { [link: string]: ReferenceObject | LinkObject }
  }

  export interface LinkObject {
    operationRef?: string
    operationId?: string
    parameters?: { [parameter: string]: any }
    requestBody?: any
    description?: string
    server?: ServerObject
  }

  export interface CallbackObject {
    [url: string]: PathItemObject
  }

  export interface SecurityRequirementObject {
    [name: string]: string[]
  }

  export interface ComponentsObject {
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

  export interface HttpSecurityScheme {
    type: 'http'
    description?: string
    scheme: string
    bearerFormat?: string
  }

  export interface ApiKeySecurityScheme {
    type: 'apiKey'
    description?: string
    name: string
    in: string
  }

  export interface OAuth2SecurityScheme {
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

  export interface OpenIdSecurityScheme {
    type: 'openIdConnect'
    description?: string
    openIdConnectUrl: string
  }

  export interface TagObject {
    name: string
    description?: string
    externalDocs?: ExternalDocumentationObject
  }
}
