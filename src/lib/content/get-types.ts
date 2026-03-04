export const getContentTypesList = () => {
    const files = import.meta.glob('./latest/**.ts', { eager: true });
    return Object.keys(files).map((filePath) => {
        const match = filePath.match(/\/latest\/(.*)\.ts$/);
        return match ? match[1] : null;
    }).filter((type) => type !== null) as string[];
};

export default function getContentTypes() {
    const contentTypes = getContentTypesList();
    const types = JSON.stringify(contentTypes, null, 2);
    return types;
}
