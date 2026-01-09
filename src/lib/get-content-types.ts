export default function getContentTypes() {
    const files = import.meta.glob('../content/latest/**.ts');
    const contentTypes = Object.keys(files).map((filePath) => {
        const match = filePath.match(/\/content\/latest\/(.*)\.ts$/);
        return match ? match[1] : null;
    }).filter((type) => type !== null);

    const types = JSON.stringify(contentTypes, null, 2);
    return types;
}