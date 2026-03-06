import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // 使用 3001 埠號，避免與 Issuer (3000) 衝突

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`學生錢包 DApp 已啟動: http://localhost:${PORT}`);
    console.log(`請用瀏覽器開啟上方網址`);
    console.log(`========================================`);
});