import fs from 'fs';

const syncedFiles = ['CLAUDE.md'];

syncedFiles.forEach(file => {
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
});