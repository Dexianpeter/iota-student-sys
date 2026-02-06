const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 核心簽發函式：將學生資料封裝成數位憑證 (VC)
 * @param {Object} studentProfile - 傳入的學生複雜物件
 */
function createVerifiableCredential(studentProfile) {
    try {
        // 1. 讀取學校私鑰（Issuer 的數位印章）
        const vaultPath = path.join(__dirname, '../data/school_vault.json');
        const schoolVault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
        const privateKey = Buffer.from(schoolVault.privateKey, 'hex');

        // 2. 構建完整資料物件 (Full Data Object)

        const fullData = {
            issuer: schoolVault.did,
            subject: studentProfile, // 嵌入多層次物件
            issuedAt: new Date().toISOString(),
            type: "UniversityStudentCredential"
        };

        // 3. 執行數位簽署 (Digital Signing)
        // 使用 UTF-8 編碼將物件轉為字串並計算簽名
        const dataToSign = JSON.stringify(fullData);
        const signature = crypto.sign(null, Buffer.from(dataToSign), {
            key: privateKey,
            format: 'der',
            type: 'pkcs8'
        });

        // 4. 回傳標準格式的憑證物件
        return {
            data: fullData,
            proof: {
                type: "Ed25519Signature",
                signature: signature.toString('hex')
            }
        };
    } catch (error) {
        console.error("Issuance Error:", error);
        return null;
    }
}

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
    const vc = createVerifiableCredential(s.profile);
    if (vc) {
        const filePath = path.join(holderDir, `${s.name}_card.json`);
        // 使用 UTF-8 編碼將完整 VC 存入學生「錢包」
        fs.writeFileSync(filePath, JSON.stringify(vc, null, 2), 'utf8');
        console.log(`Success! Credential issued for ${s.name}: ${filePath}`);
    }
});