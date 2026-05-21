import bcrypt from 'bcryptjs'

import { prisma } from '../src/index.js'

const email = process.env.USER_EMAIL
const password = process.env.USER_PASSWORD

if (!email || !password) {
  console.error('USER_EMAIL and USER_PASSWORD must be set')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)

await prisma.user.upsert({
  where: { email },
  update: { passwordHash: hash },
  create: { email, passwordHash: hash },
})

console.log(`User ${email} created/updated.`)
await prisma.$disconnect()
