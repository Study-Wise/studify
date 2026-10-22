import fs from 'fs';

const originalFile = 'AGENTS.md';
const syncedFiles = ['CLAUDE.md'];

if (!fs.existsSync(originalFile)) {
    console.error(`Original file "${originalFile}" does not exist.`);
    process.exit(1);
}

syncedFiles.forEach(file => {
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    fs.copyFileSync(originalFile, file);
});