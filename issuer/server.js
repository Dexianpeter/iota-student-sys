import express from 'express';
import { issueVerifiableCredential } from './vc_utils.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors()); // 啟用 CORS
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = 3000;

// --- API 路由 ---

app.post('/issue-credential', (req, res) => {
    const { studentProfile, type } = req.body;
    
    if (!studentProfile || !studentProfile.basicInfo) {
        return res.status(400).json({ error: "Missing student basic information" });
    }

    const vc = issueVerifiableCredential(studentProfile, type);
    
    if (vc) {
        // 新增：將完整的 VC 物件轉換為 Base64 字串
        const base64Vc = Buffer.from(JSON.stringify(vc)).toString('base64');
        console.log(`Success! Issued credential for: ${studentProfile.basicInfo.name}`);
        
        // 同時回傳 VC JSON 和 Base64 字串
        res.json({ vc: vc, base64Vc: base64Vc }); 
    } else {
        res.status(500).json({ error: "Failed to issue credential" });
    }
});

// 新增：驗證憑證 API
app.post('/verify-credential', (req, res) => {
    const vc = req.body;

    try {
        // 1. 讀取學校公鑰 (從 vault 中取得)
        const vaultPath = path.join(__dirname, '../data/school_vault.json');
        const schoolVault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));

        // 2. 檢查 Issuer DID 是否匹配
        if (vc.data.issuer !== schoolVault.did) {
            return res.json({ verified: false, message: "Issuer DID mismatch" });
        }

        // 3. 驗證簽章
        const dataToVerify = JSON.stringify(vc.data);
        const signatureBuffer = Buffer.from(vc.proof.signature, 'hex');
        const publicKey = crypto.createPublicKey({
            key: Buffer.from(schoolVault.privateKey, 'hex'),
            format: 'der',
            type: 'pkcs8'
        });

        const isVerified = crypto.verify(
            null,
            Buffer.from(dataToVerify),
            publicKey,
            signatureBuffer
        );

        res.json({ verified: isVerified });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ verified: false, message: "Server error during verification" });
    }
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Issuer Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/index.html to issue credentials.`);
    console.log(`========================================`);
});