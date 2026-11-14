export function getContentTypesList() {
    return Object.keys(import.meta.glob('./latest/**.ts', { eager: true })).map(filePath => filePath.match(/\/latest\/(.*)\.ts$/)?.[1] || null).filter(type => type !== null);
}

export function getContentTypes() {
    const contentTypes = getContentTypesList();
    const types = JSON.stringify(contentTypes, null, 2);
    return types;
}
