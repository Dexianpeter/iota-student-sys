import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 核心簽發函式：將學生資料封裝成數位憑證 (VC)
 * @param {Object} studentProfile - 傳入的學生複雜物件
 * @param {string} credentialType - 憑證類型 (例如 "UniversityDegreeCredential")
 * @returns {Object|null} - 回傳 VC 物件或在發生錯誤時回傳 null
 */
export function issueVerifiableCredential(studentProfile, credentialType = "UniversityStudentCredential") {
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
            type: ["VerifiableCredential", credentialType]
        };

        // 3. 執行數位簽署 (Digital Signing)
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