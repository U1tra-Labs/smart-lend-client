import { DriftClient } from '@drift-labs/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';

// 初始化 Solana 连接
const connection = new Connection('devnet');

// 用户钱包（假设已经初始化）
const wallet = Wallet.local();

// 初始化 Drift 客户端
const driftClient = new DriftClient({
  connection,
  programID: new PublicKey('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'), // Drift 协议的程序 ID
  wallet,
});

// 加载用户账户