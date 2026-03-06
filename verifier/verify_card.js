import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 驗證函式
 * @param {string} vcPath - 憑證檔案的路徑
 */
function verifyStudentCard(vcPath) {
    try {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
        // 1. 讀取學生的憑證 (VC) JSON 檔案
        const vc = JSON.parse(fs.readFileSync(vcPath, 'utf8'));
        // 以 utf-8 轉碼
        const { data, proof } = vc;

        // 2. 獲取發證者的公鑰 (從 data 資料夾中的學校金鑰庫取得)
        // 在真實的 IOTA 環境中，這步驟會改為從 Tangle 帳本抓取 DID 文件
        const vaultPath = path.join(__dirname, '../data/school_vault.json');
        const schoolVault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
        
        // 檢查憑證上的發證者 DID 是否與我們信任的學校 DID 相符
        if (data.issuer !== schoolVault.did) {
            console.log("Error: This credential was not issued by this school.");
            return false;
        }

        // 3. 準備驗證所需的數據 
        // 重要：這裡的 JSON 字串必須與簽署時完全一致，少一個空格都不行（全有或全無特性）
        const dataToVerify = JSON.stringify(data);
        const signatureBuffer = Buffer.from(proof.signature, 'hex');

        // 4. 使用 crypto.verify 進行數學層面的比對
        // 這步會結合「公鑰」、「原始資料」與「數位簽章」來運算
        const isVerified = crypto.verify(
            null, 
            Buffer.from(dataToVerify), 
            {
                key: crypto.createPublicKey({
                    // 從存儲的私鑰中衍生出公鑰進行驗證
                    key: Buffer.from(schoolVault.privateKey, 'hex'), 
                    format: 'der',
                    type: 'pkcs8'
                }),
                format: 'der',
                type: 'pkcs8'
            },
            signatureBuffer
        );

        // 根據驗證結果輸出對應訊息
        if (isVerified) {
            console.log(`Success! Student: ${data.subject.basicInfo.name}. Data integrity verified.`);
        } else {
            console.log("Error: Digital signature mismatch. Data may have been tampered with!");
        }

        return isVerified;

    } catch (error) {
        // 捕捉檔案讀取失敗或格式錯誤等意外
        console.error("Verification Error:", error);
        return false;
    }
}

// --- 測試場景執行 ---

console.log("--- Verifying Alice's Credential ---");
verifyStudentCard(path.join(__dirname, '../holder/alice_card.json'));

console.log("\n--- Verifying Bob's Credential ---");
verifyStudentCard(path.join(__dirname, '../holder/bob_card.json'));