const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSequences() {
  console.log('🔧 Fixing PostgreSQL sequences...')

  try {
    // Fix sequences for all tables with auto-incrementing IDs
    const tables = [
      'sys_tenant',
      'sys_invitation_code', 
      'sys_invitation_usage',
      't_family'
    ]

    for (const table of tables) {
      try {
        // Get the maximum ID from the table
        const result = await prisma.$queryRaw`SELECT MAX(id) as max_id FROM ${table}`
        const maxId = result[0]?.max_id || 0
        
        // Reset the sequence to max_id + 1
        await prisma.$queryRaw`SELECT setval(pg_get_serial_sequence('${table}', 'id'), ${maxId + 1}, false)`
        
        console.log(`✅ Fixed sequence for ${table} (max_id: ${maxId})`)
      } catch (error) {
        console.error(`❌ Error fixing sequence for ${table}:`, error.message)
      }
    }

    console.log('🎉 All sequences fixed successfully!')
  } catch (error) {
    console.error('❌ Error fixing sequences:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSequences()
