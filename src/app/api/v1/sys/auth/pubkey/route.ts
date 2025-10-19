import { NextResponse } from 'next/server'
import NodeRSA from 'node-rsa'

// GET /api/auth/pubkey - Get RSA public key for password encryption
export async function GET() {
    try {
        let privateKeyBase64 = process.env.NEXTAUTH_RSA_PRIVATE_KEY

        // If no private key is configured, generate a temporary one for development
        if (!privateKeyBase64) {
            console.warn('No RSA private key configured, generating temporary key for development')
            const key = new NodeRSA({ b: 2048 })
            privateKeyBase64 = Buffer.from(key.exportKey('private')).toString('base64')
        }

        // Decode base64 to get the actual PEM format
        const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf8')
        const key = new NodeRSA(privateKeyPem)
        // Use PKCS1 padding to match JSEncrypt default
        key.setOptions({ encryptionScheme: 'pkcs1' })
        const publicKeyPem = key.exportKey('public')

        // Also provide base64 encoded version for easier browser usage
        const publicKeyBase64 = Buffer.from(publicKeyPem).toString('base64')

        return NextResponse.json({
            publicKey: publicKeyPem,
            publicKeyBase64: publicKeyBase64
        })
    } catch (error) {
        console.error('Error generating public key:', error)
        return NextResponse.json(
            { error: 'Failed to generate public key' },
            { status: 500 }
        )
    }
}
