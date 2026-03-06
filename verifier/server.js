import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002; // 使用 3002 埠號 (Verifier)

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`第三方查驗平台 (Verifier) 已啟動: http://localhost:${PORT}`);
    console.log(`========================================`);
});