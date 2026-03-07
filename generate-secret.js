const crypto = require('crypto')

// Generate a secure NextAuth secret
const secret = crypto.randomBytes(32).toString('base64')

console.log('NextAuth Secret:')
console.log(secret)
console.log('\nAdd this to your environment variables:')
console.log('NEXTAUTH_SECRET=' + secret)
