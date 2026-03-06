import fs from 'fs';
import path from 'path';
import { issueVerifiableCredential } from './vc_utils.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 批次簽發與自動化儲存邏輯 ---

// 定義具有多層次結構的學生資料（Object-in-Object）
const students = [
    { 
        name: "alice", 
        profile: { 
            basicInfo: { name: "Alice Wang", id: "B11001001" },
            academicStatus: { department: "CS", year: 3, gpa: 3.9 },
            activities: ["Blockchain Club", "Basketball Team"]
        } 
    },
    { 
        name: "bob", 
        profile: { 
            basicInfo: { name: "Bob Lee", id: "B11001005" },
            academicStatus: { department: "EE", year: 2, gpa: 3.7 },
            activities: ["Photography Society"]
        } 
    }
];

// 1. 設定持有人（學生錢包）的存放資料夾
const holderDir = path.join(__dirname, '../holder');

// 2. 環境初始化：自動建立資料夾
if (!fs.existsSync(holderDir)) {
    console.log("Directory 'holder' not found, creating it...");
    fs.mkdirSync(holderDir, { recursive: true }); 
}

// 3. 遍歷學生清單，產出數位憑證並存檔
students.forEach(s => {
    const vc = issueVerifiableCredential(s.profile);
    if (vc) {
        const filePath = path.join(holderDir, `${s.name}_card.json`);
        // 使用 UTF-8 編碼將完整 VC 存入學生「錢包」
        fs.writeFileSync(filePath, JSON.stringify(vc, null, 2), 'utf8');
        console.log(`Success! Credential issued for ${s.name}: ${filePath}`);
    }
});