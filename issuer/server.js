const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // 解析 JSON 格式的請求體

const PORT = 3000;

/**
 * 核心簽發函式：將傳入的學生 Profile 簽署為憑證 (VC)
 */
function issueVC(studentProfile) {
    // 1. 讀取學校私鑰 (簽章用)
    const vaultPath = path.join(__dirname, '../data/school_vault.json');
    const schoolVault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
    const privateKey = Buffer.from(schoolVault.privateKey, 'hex');

    // 2. 構建完整憑證物件 (包含之前討論的 Complex Object)
    const fullData = {
        issuer: schoolVault.did,
        subject: studentProfile, // 這裡接收前端傳來的學生資料物件
        issuedAt: new Date().toISOString(),
        type: "UniversityStudentCredential"
    };

    // 3. 數位簽署 (Ed25519)
    const dataToSign = JSON.stringify(fullData);
    const signature = crypto.sign(null, Buffer.from(dataToSign), {
        key: privateKey,
        format: 'der',
        type: 'pkcs8'
    });

    return {
        data: fullData,
        proof: {
            type: "Ed25519Signature",
            signature: signature.toString('hex')
        }
    };
}

// --- API 路由 ---

/**
 * [POST] /issue-credential
 * 接收學生資料，回傳簽名後的憑證
 */
app.post('/issue-credential', (req, res) => {
    const studentProfile = req.body;

    // 簡單檢查資料完整性
    if (!studentProfile || !studentProfile.basicInfo) {
        return res.status(400).json({ error: "Missing student basic information" });
    }

    const vc = issueVC(studentProfile);
    
    if (vc) {
        console.log(`Success! Issued credential for: ${studentProfile.basicInfo.name}`);
        res.json(vc); // 回傳 JSON 給前端
    } else {
        res.status(500).json({ error: "Failed to issue credential" });
    }
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Issuer Server running on http://localhost:${PORT}`);
    console.log(`Ready to handle issuance requests.`);
    console.log(`========================================`);
});