import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

console.log('Reading .env from:', envPath);

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    console.log('File content length:', envFile.length);
    console.log('First 50 chars:', envFile.substring(0, 50).replace(/\n/g, '\\n').replace(/\r/g, '\\r'));

    const envConfig = {};
    envFile.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            envConfig[key] = value;
            console.log(`Parsed Key: |${key}|`);
            console.log(`Parsed Value Start: |${value.substring(0, 10)}|`);
        }
    });

    console.log('Final URL:', envConfig.VITE_SUPABASE_URL);
} else {
    console.error('File not found');
}
