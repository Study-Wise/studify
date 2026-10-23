export async function extractTextFromPDF(file: File): Promise<string | null> {
    try {
        // For MVP: Return placeholder
        // In production: Use pdf-parse or similar library
        return `[PDF file: ${file.name} - Text extraction requires pdf-parse library. File size: ${(file.size / 1024).toFixed(1)} KB]`;
    } catch (error) {
        console.error('PDF extraction error:', error);
        return null;
    }
}

export async function extractTextFromPlainText(file: File): Promise<string | null> {
    try {
        // Limit to 10,000 characters to avoid token limits
        return (await file.text()).substring(0, 10000);
    } catch (error) {
        console.error('Text extraction error:', error);
        return null;
    }
}

export async function extractTextFromImage(file: File): Promise<string | null> {
    try {
        // For MVP: Return placeholder
        // In production: Use Tesseract.js or cloud OCR service
        return `[Image file: ${file.name} - OCR requires Tesseract.js. File size: ${(file.size / 1024).toFixed(1)} KB]`;
    } catch (error) {
        console.error('Image extraction error:', error);
        return null;
    }
}

export async function extractTextFromFile(file: File): Promise<string | null> {
    if (file.type === 'text/plain' || file.type === 'text/csv' ||
        file.type === 'text/html' || file.type === 'text/markdown') {
        return await extractTextFromPlainText(file);
    }

    if (file.type === 'application/pdf') return await extractTextFromPDF(file);

    if (file.type.startsWith('image/')) return await extractTextFromImage(file);

    // For other file types, return metadata only
    return `[File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(1)} KB]`;
}
