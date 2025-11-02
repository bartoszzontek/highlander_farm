// src/db.js
import Dexie from 'dexie';

export const db = new Dexie('HighlanderFarmDB');

// Wersja 1 bazy danych (bez zmian)
db.version(1).stores({
  cows: '&id, tag_id, name, breed', 
  events: '&id, date, cow, event_type',
});

// Wersja 2 dodaje tabelę syncQueue
db.version(2).stores({
  syncQueue: '++id, action, entityId, tempId',
});

// === NOWA WERSJA BAZY DANYCH ===
// Wersja 3 dodaje indeks do 'payload.cow' w syncQueue
db.version(3).stores({
  // Nie musimy powtarzać starych tabel,
  // ale musimy zaktualizować definicję syncQueue
  syncQueue: '++id, action, entityId, tempId, payload.cow', // <-- DODANO INDEKS
});
