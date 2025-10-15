-- CreateWeb3Configs
-- Insert Web3 related configurations into sys_config table

-- Network configurations
INSERT INTO "sys_config" ("type", "key", "value", "remark", "create_date", "update_date") VALUES
('WEB3_NETWORK_CONFIG', 'WEB3_NETWORK_CONFIG_ETHEREUM', '{"chainId":1,"name":"Ethereum Mainnet","rpcUrl":"https://eth-mainnet.g.alchemy.com/v2/demo","blockExplorer":"https://etherscan.io"}', 'Ethereum network configuration', NOW(), NOW()),
('WEB3_NETWORK_CONFIG', 'WEB3_NETWORK_CONFIG_STARKNET', '{"chainId":"0x534e5f5345504f4c4941","name":"Starknet Devnet","rpcUrl":"http://localhost:5050/rpc","blockExplorer":"https://sepolia.starkscan.co"}', 'Starknet network configuration', NOW(), NOW());

-- Token addresses
INSERT INTO "sys_config" ("type", "key", "value", "remark", "create_date", "update_date") VALUES
('WEB3_TOKEN_ADDRS', 'WEB3_TOKEN_ADDRS_ETHEREUM', '{"USDC":"0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C","USDT":"0xdAC17F958D2ee523a2206206994597C13D831ec7","KRC":"0x1234567890123456789012345678901234567890"}', 'Ethereum token addresses', NOW(), NOW()),
('WEB3_TOKEN_ADDRS', 'WEB3_TOKEN_ADDRS_STARKNET', '{"USDC":"0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06b3ad0df8c","USDT":"0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8","KRC":"0x1234567890123456789012345678901234567890123456789012345678901234"}', 'Starknet token addresses', NOW(), NOW());

-- Contract addresses
INSERT INTO "sys_config" ("type", "key", "value", "remark", "create_date", "update_date") VALUES
('WEB3_CONTRACT_ADDRS', 'WEB3_CONTRACT_ADDRS_ETHEREUM', '{"KidsViewerVault":"0x1234567890123456789012345678901234567890","KidsViewerPiggyBank":"0x0987654321098765432109876543210987654321","KRC":"0x1234567890123456789012345678901234567890"}', 'Ethereum contract addresses', NOW(), NOW()),
('WEB3_CONTRACT_ADDRS', 'WEB3_CONTRACT_ADDRS_STARKNET', '{"KidsViewerVault":"0x0000000000000000000000000000000000000000000000000000000000000000","KidsViewerPiggyBank":"0x03408bc6b059e7f8735e3206ad6b4450a3bfde02369ba00c2454fa22c41672ca","KRC":"0x0544e457da0bce9911e33b97367442a90ad8f046dbcf5dfb1e74323c12dc4ca3"}', 'Starknet contract addresses', NOW(), NOW());

-- AAVE Products
INSERT INTO "sys_config" ("type", "key", "value", "remark", "create_date", "update_date") VALUES
('WEB3_AAVE_PRODUCTS', 'WEB3_AAVE_PRODUCTS_ETHEREUM', '[{"id":"usdc-lending-ethereum","name":"USDC Lending Pool (Ethereum)","symbol":"aUSDC","apr":3.2,"address":"0x1234567890123456789012345678901234567890","chainId":1},{"id":"usdt-lending-ethereum","name":"USDT Lending Pool (Ethereum)","symbol":"aUSDT","apr":2.8,"address":"0x0987654321098765432109876543210987654321","chainId":1}]', 'Ethereum AAVE products', NOW(), NOW()),
('WEB3_AAVE_PRODUCTS', 'WEB3_AAVE_PRODUCTS_STARKNET', '[{"id":"usdc-lending-starknet","name":"USDC Lending Pool (Starknet)","symbol":"aUSDC","apr":3.5,"address":"0x1234567890123456789012345678901234567890123456789012345678901234","chainId":"0x534e5f4d41494e"}]', 'Starknet AAVE products', NOW(), NOW());
