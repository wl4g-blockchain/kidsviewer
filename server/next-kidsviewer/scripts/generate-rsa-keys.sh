#!/bin/bash

# Generate RSA key pair for password encryption
# This script generates a 2048-bit RSA key pair and outputs them in base64 format

echo "🔐 Generating RSA key pair for password encryption..."

# Generate private key
openssl genrsa -out private_key.pem 2048

# Generate public key from private key
openssl rsa -in private_key.pem -pubout -out public_key.pem

# Convert to base64 for environment variables
echo ""
echo "📋 Add these to your .env file:"
echo ""

echo "# RSA Keys for password encryption"
echo "NEXTAUTH_RSA_PRIVATE_KEY=\"$(base64 -i private_key.pem | tr -d '\n')\""
echo "RSA_PUBLIC_KEY=\"$(base64 -i public_key.pem | tr -d '\n')\""

echo ""
echo "✅ RSA key pair generated successfully!"
echo "📁 Files created:"
echo "   - private_key.pem (keep this secure!)"
echo "   - public_key.pem"
echo ""
echo "⚠️  Remember to:"
echo "   1. Add the base64 keys to your .env file"
echo "   2. Never commit the .pem files to version control"
echo "   3. Keep the private key secure"

# Clean up the .pem files (optional - uncomment if you want to remove them)
# rm private_key.pem public_key.pem
