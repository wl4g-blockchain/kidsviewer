const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create default tenant
  const tenant = await prisma.sysTenant.create({
    data: {
      name: 'Default Family',
      remark: 'Default tenant for KidsViewer',
      properties: {},
      createDate: new Date(),
      updateDate: new Date(),
      createBy: 1,
      updateBy: 1,
    }
  })

  console.log('Created tenant:', tenant)

  // Create default admin user
  const adminUser = await prisma.sysUser.create({
    data: {
      id: 1,
      name: 'Admin',
      email: 'admin@kidsviewer.com',
      password: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // SHA256 of empty string
      tenantId: tenant.id,
      userType: 1, // Main account
      createDate: new Date(),
      updateDate: new Date(),
      createBy: 1,
      updateBy: 1,
    }
  })

  console.log('Created admin user:', adminUser)

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
