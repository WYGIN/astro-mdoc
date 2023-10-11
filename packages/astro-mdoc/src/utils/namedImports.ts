export const getNamedImport = (component: object): string => {
    return Object.keys(component).find(item => item !== 'default') ?? ''
}