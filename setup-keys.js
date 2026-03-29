// ──────────────────────────────────────────────────────────
// setup-keys.js — Generate Polymarket API credentials
// Uses the official @polymarket/clob-client SDK.
// Run this ONCE: node setup-keys.js
// ──────────────────────────────────────────────────────────
import 'dotenv/config';
import { ethers } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137;

async function main() {
  console.log('\n  ◆ Polymarket API Key Setup\n');

  const privateKey = process.env.POLYMARKET_PRIVATE_KEY;

  if (!privateKey || privateKey.startsWith('your_') || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000001') {
    console.log('  ✗ Set POLYMARKET_PRIVATE_KEY in your .env file first.\n');
    process.exit(1);
  }

  try {
    const wallet = new ethers.Wallet(privateKey);
    console.log(`  Wallet address: ${wallet.address}`);
    console.log('  Generating API credentials via Polymarket SDK...\n');

    // The Polymarket SDK expects either:
    //   - An ethers v5 signer (has _signTypedData)
    //   - A viem wallet client (has signTypedData + account.address)
    // ethers v6 has signTypedData (no underscore), so we need to
    // wrap it to look like an ethers v5 signer.
    const signerShim = {
      getAddress: () => Promise.resolve(wallet.address),
      _signTypedData: (domain, types, value) => wallet.signTypedData(domain, types, value),
    };

    const client = new ClobClient(CLOB_HOST, CHAIN_ID, signerShim);

    // This creates new credentials or derives existing ones
    const credentials = await client.createOrDeriveApiKey();

    if (credentials) {
      console.log('  ✓ API credentials generated!\n');
      console.log('  ┌───────────────────────────────────────────────────────────────┐');
      console.log(`  │ API Key:    ${credentials.key}`);
      console.log(`  │ Secret:     ${credentials.secret}`);
      console.log(`  │ Passphrase: ${credentials.passphrase}`);
      console.log('  └───────────────────────────────────────────────────────────────┘\n');
      console.log('  Now update your .env file:');
      console.log(`    POLYMARKET_API_KEY=${credentials.key}`);
      console.log(`    POLYMARKET_API_SECRET=${credentials.secret}`);
      console.log(`    POLYMARKET_PASSPHRASE=${credentials.passphrase}\n`);
      console.log('  Then restart the bot: npm start\n');
    } else {
      console.log('  ✗ No credentials returned. You may need to register on polymarket.com first.\n');
    }

  } catch (err) {
    console.log(`  ✗ Error: ${err.message}\n`);

    if (err.message.includes('403') || err.message.includes('forbidden')) {
      console.log('  Polymarket may not be available in your region.');
      console.log('  Check: https://docs.polymarket.com/api-reference/geoblock\n');
    } else if (err.message.includes('invalid')) {
      console.log('  Your private key may be in the wrong format.');
      console.log('  It should be a 64-character hex string (with or without 0x prefix).\n');
    } else {
      console.log('  Full error:', err, '\n');
    }
    process.exit(1);
  }
}

main();
