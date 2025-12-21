#!/usr/bin/env node

/**
 * Setup script untuk membuat HTTPS development server
 * Menggunakan self-signed certificate untuk testing di handphone
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certDir = path.join(process.cwd(), '.cert');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

console.log('🔐 Setting up HTTPS for development...\n');

// Create .cert directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log('✅ Created .cert directory');
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ Certificates already exist');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}\n`);
  console.log('💡 To regenerate certificates, delete the .cert folder and run this script again.\n');
  process.exit(0);
}

// Try to use mkcert if available (recommended)
try {
  execSync('mkcert --version', { stdio: 'ignore' });
  console.log('📦 Using mkcert to generate certificates...\n');
  
  // Install local CA
  try {
    execSync('mkcert -install', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  Could not install mkcert CA (this is okay, continuing...)');
  }
  
  // Generate certificates
  execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1`, {
    stdio: 'inherit',
    cwd: certDir
  });
  
  console.log('\n✅ Certificates generated successfully using mkcert!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}\n`);
  
} catch (e) {
  // Fallback to openssl
  console.log('📦 mkcert not found, using OpenSSL to generate self-signed certificates...\n');
  
  try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    execSync(
      `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Development/CN=localhost"`,
      { stdio: 'inherit' }
    );
    
    console.log('\n✅ Self-signed certificates generated successfully!');
    console.log(`   Key: ${keyPath}`);
    console.log(`   Cert: ${certPath}\n`);
    console.log('⚠️  Note: You will need to accept the security warning in your browser.\n');
    
  } catch (opensslError) {
    console.error('❌ Error generating certificates:');
    console.error('   Make sure you have OpenSSL installed, or install mkcert:');
    console.error('   Windows: choco install mkcert');
    console.error('   Mac: brew install mkcert');
    console.error('   Linux: See https://github.com/FiloSottile/mkcert\n');
    process.exit(1);
  }
}

console.log('🚀 Next steps:');
console.log('   1. Run: npm run dev:https');
console.log('   2. Access via: https://YOUR_IP:3000');
console.log('   3. Accept the security warning in your browser\n');

