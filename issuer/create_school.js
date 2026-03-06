import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 建立學校身分與金鑰對
 */
async function createSchool() {
    try {
        // 1. 產生 Ed25519 金鑰對
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
            privateKeyEncoding: { format: 'der', type: 'pkcs8' },
            publicKeyEncoding: { format: 'der', type: 'spki' }
        });

        // 將公鑰轉換為 Hex 字串，並取前 32 位作為 DID 的識別特徵
        const publicKeyHex = publicKey.toString('hex').slice(0, 32);
        // 將私鑰轉換為 Hex 字串以便儲存（私鑰必須絕對保密）
        const privateKeyHex = privateKey.toString('hex');
        
        // 建立符合 W3C 標準格式的去中心化識別碼 (DID)
        const schoolDid = `did:iota:school:0x${publicKeyHex}`;

        // 2. 準備要存檔的資料物件
        // 在 SSI 架構中，這是學校的「數位保險箱」
        const schoolData = {
            did: schoolDid,
            privateKey: privateKeyHex,
            createdAt: new Date().toISOString()
        };

        // 3. 設定存檔路徑並執行寫入
        // 使用 path.join 確保在不同作業系統（Windows/Linux）路徑都能正確運作
        const dataDir = path.join(__dirname, '../data');
        const dataPath = path.join(dataDir, 'school_vault.json');
        
        // 確保 data 資料夾存在
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(dataPath, JSON.stringify(schoolData, null, 2));

        console.log("========================================");
        console.log("Success! School Identity Created.");
        console.log("File Path:", dataPath);
        console.log("School DID:", schoolDid);
        console.log("========================================");

    } catch (error) {
        // 捕捉並輸出初始化過程中的錯誤
        console.error("Initialization Error:", error);
    }
}

createSchool();