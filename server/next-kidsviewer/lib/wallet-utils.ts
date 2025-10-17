import { ethers } from 'ethers'
import { ec, hash } from 'starknet'

// Interface for wallet address structure
export interface WalletAddress {
    chain: string
    address: string
    chainId: number
}

// Interface for signature verification request
export interface SignatureVerificationRequest {
    address: string
    signature: string
    message: string
    chainName: string
    chainId: number
}

// Interface for signature verification result
export interface SignatureVerificationResult {
    isValid: boolean
    recoveredAddress: string
    error?: string
}

// Supported chains
const EVM_CHAINS = ['ethereum', 'sepolia', 'arbitrum', 'polygon', 'optimism', 'avalanche', 'avalancheFuji', 'bsc', 'bscTestnet', 'base', 'astar', 'kakarotStarknetSepolia', 'astarZkEVM', 'astarZkyoto']
const STARKNET_CHAINS = ['starknet']

/**
 * Verify wallet signature based on chain type
 * @param request - Signature verification request
 * @returns Signature verification result
 */
export async function verifyWalletSignature(request: SignatureVerificationRequest): Promise<SignatureVerificationResult> {
    const { address, signature, message, chainName, chainId } = request

    // Validate required fields
    if (!address || !signature || !message || !chainName || !chainId) {
        return {
            isValid: false,
            recoveredAddress: '',
            error: 'Missing required fields: address, signature, message, chainName, chainId'
        }
    }

    try {
        console.log('Signature verification debug:', {
            chainName,
            chainId,
            address,
            message,
            signature: signature.substring(0, 20) + '...',
            signatureLength: signature.length
        })

        if (EVM_CHAINS.includes(chainName.toLowerCase())) {
            return await verifyEthereumSignature(address, signature, message)
        } else if (STARKNET_CHAINS.includes(chainName.toLowerCase())) {
            return await verifyStarknetSignature(address, signature, message)
        } else {
            return {
                isValid: false,
                recoveredAddress: '',
                error: `Unsupported chain: ${chainName}`
            }
        }
    } catch (error) {
        console.error('Signature verification failed:', error)
        return {
            isValid: false,
            recoveredAddress: '',
            error: 'Invalid signature'
        }
    }
}

/**
 * Verify Ethereum signature
 * @param address - Wallet address
 * @param signature - Signature string
 * @param message - Original message
 * @returns Verification result
 */
async function verifyEthereumSignature(address: string, signature: string, message: string): Promise<SignatureVerificationResult> {
    try {
        console.log('Verifying Ethereum signature...')
        const recoveredAddress = ethers.verifyMessage(message, signature)
        const isValid = recoveredAddress.toLowerCase() === address.toLowerCase()

        console.log('Ethereum verification result:', {
            recoveredAddress,
            providedAddress: address,
            isValid
        })

        return {
            isValid,
            recoveredAddress: recoveredAddress.toLowerCase()
        }
    } catch (error) {
        console.error('Ethereum signature verification failed:', error)
        return {
            isValid: false,
            recoveredAddress: '',
            error: 'Ethereum signature verification failed'
        }
    }
}

/**
 * Verify Starknet signature
 * @param address - Wallet address
 * @param signature - Signature string or array
 * @param message - Original message
 * @returns Verification result
 */
async function verifyStarknetSignature(address: string, signature: string | string[], message: string): Promise<SignatureVerificationResult> {
    try {
        console.log('Verifying Starknet signature...')

        // Calculate message hash using Pedersen hash
        const messageHash = hash.computeHashOnElements([message])

        // Parse signature - Starknet signatures are typically in format [r, s]
        let signatureArray: string[]
        if (typeof signature === 'string') {
            // Try to parse as JSON array first, then as comma-separated values
            try {
                signatureArray = JSON.parse(signature)
            } catch {
                signatureArray = signature.split(',').map(s => s.trim())
            }
        } else {
            signatureArray = signature
        }

        // Verify signature using starkCurve
        const isValid = ec.starkCurve.verify(
            signatureArray as any,
            messageHash,
            address
        )

        console.log('Starknet verification result:', {
            address,
            isValid
        })

        return {
            isValid,
            recoveredAddress: address.toLowerCase()
        }
    } catch (error) {
        console.error('Starknet signature verification failed:', error)
        return {
            isValid: false,
            recoveredAddress: '',
            error: 'Starknet signature verification failed'
        }
    }
}

/**
 * Get chain display name
 * @param chain - Chain identifier
 * @returns Display name
 */
export function getChainDisplayName(chain: string): string {
    const chainMap: { [key: string]: string } = {
        ethereum: 'Ethereum',
        sepolia: 'Sepolia',
        starknet: 'Starknet',
        polygon: 'Polygon',
        bsc: 'BSC',
        arbitrum: 'Arbitrum',
        optimism: 'Optimism',
        avalanche: 'Avalanche',
        avalancheFuji: 'Avalanche Fuji',
        base: 'Base',
        astar: 'Astar',
        astarZkEVM: 'Astar zkEVM',
        astarZkyoto: 'Astar zkEVM Kyoto',
        kakarotStarknetSepolia: 'Kakarot Starknet Sepolia'
    }
    return chainMap[chain.toLowerCase()] || chain
}

/**
 * Check if chain is supported
 * @param chain - Chain identifier
 * @returns True if supported
 */
export function isChainSupported(chain: string): boolean {
    return EVM_CHAINS.includes(chain.toLowerCase()) || STARKNET_CHAINS.includes(chain.toLowerCase())
}

/**
 * Get supported chains
 * @returns Array of supported chain identifiers
 */
export function getSupportedChains(): string[] {
    return [...EVM_CHAINS, ...STARKNET_CHAINS]
}
