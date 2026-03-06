/**
 * IOTA 錢包工具模組
 * 負責處理 TanglePay 連接與上鏈邏輯
 */

let wallet = null;
let userAddress = null;

/**
 * 連接 TanglePay 錢包
 * @returns {Promise<string|null>} 回傳使用者位址或 null
 */
export async function connectWallet() {
    console.log("正在偵測錢包...");
    
    // 重試機制：嘗試偵測 10 次，每次間隔 200ms
    for (let i = 0; i < 10; i++) {
        if (window.tanglepay) {
            wallet = window.tanglepay;
            console.log("✅ 偵測到 TanglePay (window.tanglepay)");
            break;
        } else if (window.iota) {
            wallet = window.iota;
            console.log("✅ 偵測到 Generic IOTA Wallet (window.iota)");
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!wallet) {
        console.error("❌ 未偵測到任何錢包物件");
        alert("⚠️ 未偵測到 IOTA 錢包！\n\n請檢查以下幾點：\n1. 確保已安裝 TanglePay Chrome 擴充功能。\n2. 確保您是透過 http://localhost:3001 開啟此網頁 (不能直接點開檔案)。\n3. 請嘗試重新整理網頁 (F5)。");
        return null;
    }

    try {
        // TanglePay 的連接方式
        const res = await wallet.request({ method: 'iota_connect' });
        const accounts = await wallet.request({ method: 'iota_accounts' });
        
        if (accounts && accounts.length > 0) {
            userAddress = accounts[0];
            return userAddress;
        }
    } catch (err) {
        console.error("Wallet Error:", err);
        alert("連接失敗: " + err.message);
        return null;
    }
    return null;
}

/**
 * 將憑證指紋上傳至 IOTA Tangle
 * @param {Object} currentVc - 目前的憑證物件
 * @returns {Promise<Object|null>} 回傳交易結果或 null
 */
export async function uploadToTangle(currentVc) {
    if (!currentVc || !userAddress || !wallet) {
        console.error("Missing requirements for upload");
        return null;
    }

    try {
        // 【資料整理】準備要上鏈的 Payload
        // 這裡只上傳「簽章」與「DID」，絕對不包含學生個資！
        const signature = currentVc.proof ? currentVc.proof.signature : "unknown_signature";
        
        const payload = {
            standard: "IOTA-SSI-1.0",      // 協議版本
            type: "CredentialProof",       // 資料類型：憑證存證
            issuer: currentVc.data.issuer, // 發證學校 DID (公開資訊)
            vcType: currentVc.data.type,   // 憑證種類 (公開資訊)
            signature: signature,          // 核心：數位簽章 (隱私指紋)
            uploadedAt: new Date().toISOString()
        };

        const message = JSON.stringify(payload);
        
        // 將字串轉為 Hex (0x開頭)
        const hexData = "0x" + Array.from(message).map(c => c.charCodeAt(0).toString(16)).join('');

        // 發送交易 (Value = 0, 純資料上鏈)
        const res = await wallet.request({
            method: 'iota_sendTransaction',
            params: {
                to: userAddress, // 發給自己即可
                value: 0,
                data: hexData,
                tag: '0x53747564656e745643' // Hex for 'StudentVC'
            }
        });

        console.log("Transaction Result:", res);
        return res;

    } catch (err) {
        console.error(err);
        alert("上鏈失敗！請檢查錢包餘額 (是否足夠支付 Storage Deposit) 或網路連線。");
        return null;
    }
}

/**
 * 取得目前已連接的使用者位址
 * @returns {string|null}
 */
export function getUserAddress() {
    return userAddress;
}