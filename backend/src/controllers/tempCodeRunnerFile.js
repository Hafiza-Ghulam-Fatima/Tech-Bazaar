const bcrypt = require('bcryptjs');

async function createAdminHash() {
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(hash);
}

createAdminHash();
