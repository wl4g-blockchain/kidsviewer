import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Configure Prisma logging based on environment variables
const getPrismaLogConfig = () => {
    const logLevel = process.env.PRISMA_LOG_LEVEL || 'error'
    const enableQueryLog = process.env.PRISMA_QUERY_LOG === 'true'

    const logConfig: any[] = [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
    ]

    if (logLevel === 'info') {
        logConfig.push({ emit: 'stdout', level: 'info' })
    }

    if (enableQueryLog) {
        logConfig.push({ emit: 'event', level: 'query' })
    }

    return logConfig
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: getPrismaLogConfig(),
})

// Add query logging if enabled
if (process.env.PRISMA_QUERY_LOG === 'true') {
    (prisma as any).$on('query', (e: any) => {
        console.log('🔍 Prisma Query:', e.query)
        console.log('📊 Params:', e.params)
        console.log('⏱️  Duration:', e.duration + 'ms')
        console.log('---')
    })
}

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
