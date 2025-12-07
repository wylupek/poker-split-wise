import Database from 'better-sqlite3';

const db = new Database('../data/poker-splitwise.db');

console.log('=== CURRENT STATE ===');
console.log('\nPlayers:');
const players = db.prepare('SELECT id, name, balance FROM players').all();
players.forEach(p => console.log(`  ${p.name}: $${p.balance.toFixed(2)}`));

console.log('\nSessions:');
const sessions = db.prepare('SELECT id, date, completed FROM game_sessions').all();
console.log(`  Total sessions: ${sessions.length}`);
console.log(`  Completed: ${sessions.filter(s => s.completed).length}`);

console.log('\n=== RESETTING BALANCES TO ZERO ===');
db.prepare('UPDATE players SET balance = 0').run();

console.log('\nBalances after reset:');
const updatedPlayers = db.prepare('SELECT id, name, balance FROM players').all();
updatedPlayers.forEach(p => console.log(`  ${p.name}: $${p.balance.toFixed(2)}`));

db.close();
console.log('\n✅ Done!');
