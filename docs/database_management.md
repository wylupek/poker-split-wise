# Database Management Guide

This app uses **SQLite** running in the browser via sql.js. All data is stored locally in your browser's localStorage.

## Default Configuration

When you first open the app, the default chip configuration is generated in:

**File:** `src/lib/database.ts`
**Function:** `initializeSchema()` (lines 53-113)

```typescript
// Default chips created on first run:
const defaultChips = [
  { id: 'chip-1', label: '1', color: '#8B4513', value: 1, count: 20 },
  { id: 'chip-2', label: '5', color: '#FFFFFF', value: 5, count: 20 },
  { id: 'chip-3', label: '25', color: '#2E7D32', value: 25, count: 20 },
  { id: 'chip-4', label: '50', color: '#1976D2', value: 50, count: 20 },
  { id: 'chip-5', label: '100', color: '#FBC02D', value: 100, count: 20 }
];
```

**To change defaults permanently:**
1. Edit the `defaultChips` array in `src/lib/database.ts`
2. Clear your database (see below)
3. Reload the app - new defaults will be created

**To change for your current database:**
- Use the **Settings** tab in the app UI

---

## Clear Database

### Complete Reset

Delete all players, sessions, and settings:

```javascript
// In browser console (F12)
async function clearDB() {
  const request = indexedDB.deleteDatabase('poker-splitwise');
  request.onsuccess = () => {
    console.log('Database deleted. Reload page to create fresh database.');
    location.reload();
  };
  request.onerror = () => console.error('Failed to delete database');
}

clearDB();
```

This will delete the entire IndexedDB database and reload the page with a fresh database.

### Clear Specific Data

```javascript
// Clear only players and sessions (keep settings)
async function clearData() {
  // Open IndexedDB
  const dbRequest = indexedDB.open('poker-splitwise', 1);

  dbRequest.onsuccess = async () => {
    const idb = dbRequest.result;
    const transaction = idb.transaction(['database'], 'readonly');
    const store = transaction.objectStore('database');
    const getRequest = store.get('main');

    getRequest.onsuccess = async () => {
      const dbData = new Uint8Array(getRequest.result);
      const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
      const db = new SQL.Database(dbData);

      db.run('DELETE FROM players');
      db.run('DELETE FROM game_sessions');

      // Save back to IndexedDB
      const exportData = db.export();
      const writeTransaction = idb.transaction(['database'], 'readwrite');
      const writeStore = writeTransaction.objectStore('database');
      writeStore.put(exportData, 'main');

      writeTransaction.oncomplete = () => {
        console.log('Players and sessions cleared. Reload page.');
        location.reload();
      };
    };
  };
}

clearData();
```

---

## Export Data

### Export Database File (Recommended for Backups)

```javascript
// In browser console (F12)
async function exportDB() {
  const dbRequest = indexedDB.open('poker-splitwise', 1);

  dbRequest.onsuccess = () => {
    const idb = dbRequest.result;
    const transaction = idb.transaction(['database'], 'readonly');
    const store = transaction.objectStore('database');
    const getRequest = store.get('main');

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        console.error('No database found');
        return;
      }

      const dbData = new Uint8Array(getRequest.result);
      const blob = new Blob([dbData], { type: 'application/x-sqlite3' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'poker-splitwise-' + new Date().toISOString().split('T')[0] + '.db';
      a.click();
      URL.revokeObjectURL(url);

      console.log('Database exported!');
    };
  };
}

exportDB();
```

**Result:** Downloads a `.db` file you can open with SQLite tools.

---

### Export Players to CSV

```javascript
async function exportPlayersCSV() {
  const dbRequest = indexedDB.open('poker-splitwise', 1);

  dbRequest.onsuccess = async () => {
    const idb = dbRequest.result;
    const transaction = idb.transaction(['database'], 'readonly');
    const store = transaction.objectStore('database');
    const getRequest = store.get('main');

    getRequest.onsuccess = async () => {
      const dbData = new Uint8Array(getRequest.result);
      const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
      const db = new SQL.Database(dbData);

  const result = db.exec('SELECT * FROM players ORDER BY name');
  if (result.length === 0) {
    console.log('No players found');
    return;
  }

  // Convert to CSV
  const columns = ['id', 'name', 'balance', 'created_at', 'updated_at'];
  let csv = columns.join(',') + '\n';

  result[0].values.forEach(row => {
    csv += row.map(val => `"${val}"`).join(',') + '\n';
  });

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'players.csv';
  a.click();
  URL.revokeObjectURL(url);

      console.log('Players exported!');
    };
  };
}

exportPlayersCSV();
```

---

### Export Sessions to CSV

```javascript
async function exportSessionsCSV() {
  const dbRequest = indexedDB.open('poker-splitwise', 1);

  dbRequest.onsuccess = async () => {
    const idb = dbRequest.result;
    const transaction = idb.transaction(['database'], 'readonly');
    const store = transaction.objectStore('database');
    const getRequest = store.get('main');

    getRequest.onsuccess = async () => {
      const dbData = new Uint8Array(getRequest.result);
      const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
      const db = new SQL.Database(dbData);

  const result = db.exec('SELECT id, date, conversion_rate, starting_chips, completed FROM game_sessions ORDER BY date DESC');
  if (result.length === 0) {
    console.log('No sessions found');
    return;
  }

  const columns = ['id', 'date', 'conversion_rate', 'starting_chips', 'completed'];
  let csv = columns.join(',') + '\n';

  result[0].values.forEach(row => {
    csv += row.map(val => `"${val}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sessions.csv';
  a.click();
  URL.revokeObjectURL(url);

      console.log('Sessions exported!');
    };
  };
}

exportSessionsCSV();
```

---

## Import/Restore Database

### Import from .db File

```javascript
async function importDB(file) {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Verify it's a valid SQLite database
  const SQL = await initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` });
  const db = new SQL.Database(uint8Array);

  // Save to IndexedDB
  const dbRequest = indexedDB.open('poker-splitwise', 1);

  dbRequest.onsuccess = () => {
    const idb = dbRequest.result;
    const transaction = idb.transaction(['database'], 'readwrite');
    const store = transaction.objectStore('database');
    store.put(uint8Array, 'main');

    transaction.oncomplete = () => {
      console.log('Database imported! Reloading...');
      location.reload();
    };
  };
}

// To use: Create a file input element
// <input type="file" accept=".db" onchange="importDB(this.files[0])" />
```

**Or manually:**
1. Open browser DevTools (F12)
2. Paste the `importDB` function above
3. Create an HTML file input or use:
```javascript
const input = document.createElement('input');
input.type = 'file';
input.accept = '.db';
input.onchange = e => importDB(e.target.files[0]);
input.click();
```

---

## Using External SQLite Tools

### DB Browser for SQLite (Recommended)

1. Export your database using `exportDB()` above
2. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
3. Open your exported `.db` file
4. **Browse Data** - View tables in a nice GUI
5. **Execute SQL** - Run custom queries
6. **Edit Data** - Modify records directly
7. **Export to CSV** - Built-in export functionality
8. Save and re-import using `importDB()` above

### Command Line (sqlite3)

```bash
# After exporting the .db file
sqlite3 poker-splitwise-2024-12-05.db

# List tables
.tables

# View players
SELECT * FROM players;

# View completed sessions
SELECT * FROM game_sessions WHERE completed = 1;

# Export to CSV
.mode csv
.output players.csv
SELECT * FROM players;
.output stdout

# Exit
.quit
```

---

## Backup Strategy

### Recommended Approach

1. **Weekly Backups**: Export `.db` file using `exportDB()`
2. **Name with Date**: File will be auto-named like `poker-splitwise-2024-12-05.db`
3. **Store Safely**: Keep in cloud storage (Google Drive, Dropbox, etc.)
4. **Before Major Changes**: Export before deleting players/sessions

### What Gets Backed Up

- All players and balances
- Complete session history
- Chip configurations
- Settings

### Transfer Between Browsers/Devices

1. Export from Browser A
2. Send `.db` file to Browser B (email, USB, etc.)
3. Import in Browser B using `importDB()`

---

## Common Tasks

### Backup Before Clearing

```javascript
// 1. Export first
await exportDB();

// 2. Wait for download, then clear
localStorage.removeItem('poker-splitwise-db');

// 3. Reload page
location.reload();
```

### Move to Different Browser

```javascript
// Old browser: Export
exportDB();

// New browser: Import (use file input method above)
// Then reload page
```

---

## Storage Location

- **Browser Database:** IndexedDB
- **Database Name:** `poker-splitwise`
- **Object Store:** `database`
- **Key:** `main`
- **Format:** SQLite binary data (Uint8Array)
- **Size Limit:** Several GB (much larger than localStorage)
- **Cleared When:** Browser data/IndexedDB is cleared

**Advantages over localStorage:**
- Much larger storage capacity (GB vs ~5-10MB)
- Better performance for large datasets
- Proper database API with transactions
- Asynchronous operations (non-blocking)

**Warning:** Clearing browser data will delete your IndexedDB. Always keep backups!
