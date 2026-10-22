import { openDatabase, closeDatabase } from './index.js';
import { seedDatabase } from './seed.js';

const db = openDatabase();
const res = seedDatabase(db, { force: process.argv.includes('--force') });
console.log(JSON.stringify(res));
closeDatabase();
