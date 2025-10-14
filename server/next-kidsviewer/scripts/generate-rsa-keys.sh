#!/bin/bash

# Generate RSA key pair for password encryption
echo "Generating RSA key pair..."

# Generate private key
openssl genrsa -out private_key.pem 2048

# Generate public key
openssl rsa -in private_key.pem -pubout -out public_key.pem

# Convert to base64 for environment variables
echo "Converting keys to base64..."

# Convert private key to base64
PRIVATE_KEY_BASE64=$(base64 -i private_key.pem | tr -d '\n')
echo "RSA_PRIVATE_KEY=\"$PRIVATE_KEY_BASE64\"" >> .env.local

# Convert public key to base64
PUBLIC_KEY_BASE64=$(base64 -i public_key.pem | tr -d '\n')
echo "RSA_PUBLIC_KEY=\"$PUBLIC_KEY_BASE64\"" >> .env.local

# Clean up temporary files
rm private_key.pem public_key.pem

echo "RSA keys generated and added to .env.local"
echo "Please copy the keys to your production environment variables"
