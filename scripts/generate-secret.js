#!/usr/bin/env node

/**
 * Generate secure secrets for Nexus Platform
 * Usage: node scripts/generate-secret.js [length]
 */

const crypto = require('crypto');

// Get length from command line argument or default to 32
const length = parseInt(process.argv[2]) || 32;

// Generate secure random bytes and convert to base64
const secret = crypto.randomBytes(length).toString('base64').replace(/[+/=]/g, '').substring(0, length);

console.log(secret);

// If run directly (not imported), show usage info
if (require.main === module && process.argv.length === 2) {
  console.log('\n🔐 Nexus Platform - Secret Generator');
  console.log('=====================================');
  console.log('Generated NEXTAUTH_SECRET:', secret);
  console.log('\nUsage:');
  console.log('  node scripts/generate-secret.js        # Generate 32-char secret');
  console.log('  node scripts/generate-secret.js 64     # Generate 64-char secret');
  console.log('\nAdd this to your .env files:');
  console.log(`  NEXTAUTH_SECRET=${secret}`);
  console.log('\n⚠️  Keep this secret secure and never commit it to version control!');
}
