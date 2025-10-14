#!/usr/bin/env node

/**
 * Use Prisma client to initialize database data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Color output functions
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function printInfo(message) {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function printSuccess(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function printError(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

async function executeSqlFile(prisma, filePath, description) {
    try {
        printInfo(`Execute ${description}: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read SQL file content
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Split SQL content into individual statements by semicolon
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each SQL statement
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await prisma.$executeRawUnsafe(statement);
                } catch (error) {
                    // Ignore errors for already existing tables or sequences
                    if (error.message.includes('already exists') ||
                        error.message.includes('relation') && error.message.includes('already exists')) {
                        printWarning(`Skip existing object: ${statement.substring(0, 50)}...`);
                        continue;
                    }
                    throw error;
                }
            }
        }

        printSuccess(`${description} executed successfully!`);
        return true;
    } catch (error) {
        printError(`Failed to execute ${description}: ${error.message}`);
        return false;
    }
}

async function main() {
    const prisma = new PrismaClient();
    try {
        printInfo('Start database seed data initialization...');
        printWarning('Warning: This operation will delete all existing data!');

        // Define SQL file paths
        const ddlFile = path.join(__dirname, '..', 'prisma/migrations/init-ddl', 'migration.sql');
        const dmlFile = path.join(__dirname, '..', 'prisma/migrations/init-dml', 'migration.sql');

        // Execute DDL file
        const ddlSuccess = await executeSqlFile(prisma, ddlFile, 'DDL file');
        if (!ddlSuccess) {
            process.exit(1);
        }

        // Execute DML file
        const dmlSuccess = await executeSqlFile(prisma, dmlFile, 'DML file');
        if (!dmlSuccess) {
            process.exit(1);
        }

        printSuccess('Database seed data initialization completed!');
        printInfo('Database structure and initial data have been created.');

    } catch (error) {
        printError(`Database seed data initialization failed: ${error.message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Export for Prisma seed
module.exports = main;

// If this script is run directly
if (require.main === module) {
    main().catch((error) => {
        printError(`Unhandled error: ${error.message}`);
        process.exit(1);
    });
}
