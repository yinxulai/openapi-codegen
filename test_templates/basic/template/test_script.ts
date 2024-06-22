declare type TemplateCommand<T extends any[]> = (args: T) => string
declare function registerTemplateCommand<T extends any[]>(name: string, command: TemplateCommand<T>): void

registerTemplateCommand('throwEcho', (data: string[]): string => {
  throw data
})
