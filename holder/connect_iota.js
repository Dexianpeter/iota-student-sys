const fs = require('fs');
const path = require('path');
const { Client } = require('@iota/sdk');

/**
 * 模擬流程：連接學生錢包 -> 讀取憑證 -> 上鏈存證
 */
async function connectWalletAndUpload() {
    console.log("🔄 [DApp] 正在請求連接學生錢包...");

    // 1. 模擬「連接錢包」：掃描 holder 資料夾
    const walletDir = __dirname;
    const files = fs.readdirSync(walletDir).filter(f => f.endsWith('_card.json'));

    if (files.length === 0) {
        console.log("❌ 錢包內沒有憑證，請先向學校申請 (執行 issuer/issue_card.js)");
        return;
    }

    // 假設學生授權並選擇了第一張憑證
    const selectedFile = files[0];
    const filePath = path.join(walletDir, selectedFile);
    const vc = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log(`✅ 錢包連接成功！`);
    console.log(`📂 獲取憑證資料: ${selectedFile}`);
    console.log(`👤 學生姓名: ${vc.data.subject.basicInfo.name}`);
    console.log(`🏫 發證學校 DID: ${vc.data.issuer}`);

    // 2. 初始化 IOTA 連線
    console.log("\n🔗 正在連接 IOTA Tangle (Testnet)...");
    const client = new Client({
        nodes: ['https://api.testnet.iota.org'],
        localPow: true,
        ignoreNodeHealth: true,
    });

    try {
        // 3. 提取憑證指紋 (Proof) 並上鏈
        // 注意：我們只上傳「簽章」與「DID」，不包含學生個資，確保隱私
        const payload = {
            vc_type: vc.data.type,
            issuer: vc.data.issuer,
            signature: vc.proof.signature,
            timestamp: new Date().toISOString()
        };

        const dataHex = '0x' + Buffer.from(JSON.stringify(payload)).toString('hex');
        const tagHex = '0x' + Buffer.from('VerifiableCredential').toString('hex');

        console.log("🚀 正在將憑證指紋上傳至區塊鏈...");
        
        const [blockId, block] = await client.buildAndPostBlock(null, {
            tag: tagHex,
            data: dataHex
        });

        console.log("========================================");
        console.log("🎉 上鏈成功！憑證已永久存證");
        console.log(`🆔 Block ID: ${blockId}`);
        console.log(`🌐 Explorer: https://explorer.iota.org/testnet/block/${blockId}`);
        console.log("========================================");

    } catch (error) {
        console.error("⚠️ 上鏈失敗:", error);
        console.log("💡 提示: 如果是網路問題，請嘗試使用手機熱點。");
    }
}

connectWalletAndUpload();