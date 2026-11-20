import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('./data/lattice.db');
console.log('sample tuya readings:');
console.log(JSON.stringify(db.prepare("SELECT device_id,power_w,energy_kwh,energy_kwh_total,timestamp FROM readings WHERE device_id='d778b7c81ccd51c86csrkk' ORDER BY timestamp DESC LIMIT 3").all(), null, 2));
console.log('sum energy for that device today:', JSON.stringify(db.prepare("SELECT SUM(energy_kwh) s, COUNT(*) c FROM readings WHERE device_id='d778b7c81ccd51c86csrkk'").get()));
db.close();