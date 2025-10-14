import { NextResponse } from 'next/server'
import NodeRSA from 'node-rsa'

// GET /api/auth/public-key - Get RSA public key for password encryption
export async function GET() {
    try {
        const privateKeyBase64 = process.env.NEXTAUTH_RSA_PRIVATE_KEY

        if (!privateKeyBase64) {
            return NextResponse.json(
                { error: 'RSA private key not configured' },
                { status: 500 }
            )
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
