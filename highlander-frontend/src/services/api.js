// src/services/api.js
import { db } from '../db'; 
import { liveQuery } from 'dexie'; 
import { authService } from './auth';
import { toast } from 'sonner'; // <-- IMPORT TOAST

// === 1. WARSTWA SIECIOWA (BEZ ZMIAN) ===

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const authedFetch = async (url, options = {}) => {
  const token = authService.getAccessToken();
  if (!(options.body instanceof FormData)) {
    options.headers = { 'Content-Type': 'application/json', ...options.headers };
  } else {
     delete options.headers?.['Content-Type'];
  }
  if (token) {
    options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  }
  const response = await fetch(url, options);
  if (response.status === 401) {
    toast.error("Sesja wygasła. Zaloguj się ponownie.");
    authService.logout(); 
    throw new Error("Sesja wygasła.");
  }
  return response;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try { errorData = await response.json(); } catch (e) {
      if (response.status === 0 || !response.status) throw new Error('Jesteś offline. Nie można połączyć z serwerem.');
      errorData = { detail: 'Nieznany błąd serwera' };
    }
    if (typeof errorData === 'object' && errorData !== null && !errorData.detail) {
      const messages = Object.entries(errorData).map(([key, value]) => {
        const fieldName = key.replace('_', ' ');
        if (key === 'non_field_errors') return Array.isArray(value) ? value.join(', ') : value;
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`;
      });
      throw new Error(messages.join(' '));
    }
    throw new Error(errorData.detail || 'Błąd serwera');
  }
  if (response.status === 204) return true;
  const data = await response.json();
  return data.results || data; 
};

export const networkApi = {
  getCows: async () => handleResponse(await authedFetch(`${API_BASE_URL}/cows/`)),
  getCow: async (id) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/${id}/`)),
  searchCow: async (tagId) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/search/?tag_id=${tagId}`)),
  getEventsForCow: async (cowId) => handleResponse(await authedFetch(`${API_BASE_URL}/events/?cow=${cowId}`)),
  createCow: async (data) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/`, { method: 'POST', body: JSON.stringify(data) })),
  updateCow: async (id, data) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })),
  deleteCow: async (id) => {
    const response = await authedFetch(`${API_BASE_URL}/cows/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Błąd usuwania krowy');
    return true;
  },
  uploadPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return handleResponse(await authedFetch(`${API_BASE_URL}/cows/${id}/upload_photo/`, { method: 'POST', body: formData }));
  },
  createEvent: async (data) => handleResponse(await authedFetch(`${API_BASE_URL}/events/`, { method: 'POST', body: JSON.stringify(data) })),
  syncBatch: async (jobs) => {
    const response = await authedFetch(`${API_BASE_URL}/sync/`, {
      method: 'POST',
      body: JSON.stringify({ jobs }),
    });
    const data = await response.json();
    if (!response.ok) {
       throw new Error(data.message || 'Błąd serwera synchronizacji');
    }
    return data; 
  },
};

// === 2. SERWIS SYNCHRONIZACJI (Z TOASTAMI) ===

let isSyncing = false; 

export const syncService = {
  
  processSyncQueue: async () => {
    if (isSyncing) { return; }
    if (!navigator.onLine) { return; }
    
    isSyncing = true; 
    const jobs = await db.syncQueue.orderBy('id').toArray();
    
    if (jobs.length === 0) { isSyncing = false; return; }

    console.log(`Rozpoczynam synchronizację (${jobs.length} zadań)...`);
    toast.loading(`Synchronizowanie ${jobs.length} zmian...`);

    try {
      const { status, results } = await networkApi.syncBatch(jobs); 
      if (status !== 'ok') { throw new Error("Odpowiedź serwera synchronizacji nie jest 'ok'"); }

      let errorCount = 0;
      let successCount = 0;

      await db.transaction('rw', db.cows, db.events, db.syncQueue, async () => {
        for (const result of results) {
          const originalJob = jobs.find(j => j.id === result.queueId);
          if (!originalJob) continue;

          if (result.status === 'ok' || result.status === 'merged') {
            successCount++;
            if (result.action === 'createCow' && result.realId) {
              await db.cows.update(result.tempId, { id: result.realId });
              await db.syncQueue.where('payload.cow').equals(result.tempId).modify({ 'payload.cow': result.realId });
              await db.events.where('cow').equals(result.tempId).modify({ cow: result.realId });
            }
            if (result.action === 'createEvent' && result.realId) {
              await db.events.update(result.tempId, { id: result.realId });
            }
            await db.syncQueue.delete(originalJob.id);
            
          } else {
            // === BŁĄD (KONFLIKT) ===
            errorCount++;
            console.error(`Błąd synchronizacji zadania: ${result.error}`);
            await db.syncQueue.delete(originalJob.id);
            
            if (result.action === 'createCow' && (result.error.includes('unique') || result.error.includes('IntegrityError'))) {
              await db.cows.delete(result.tempId); 
              toast.error(`Błąd: Krowa ${originalJob.payload.tag_id} już istnieje. Zmiany anulowane.`);
            } 
            else if (result.action === 'updateCow' && result.error.includes('matching query does not exist')) {
              toast.error(`Błąd: Krowa (ID: ${originalJob.entityId}) nie istnieje na serwerze. Zmiany anulowane.`);
              repository.syncCows(); 
            }
            else {
              toast.error(`Błąd synchronizacji ${result.action} (ID: ${originalJob.id}). Zadanie anulowane.`);
            }
          }
        }
      });
      
      toast.dismiss(); // Zamknij toast ładowania
      if (errorCount > 0) {
        toast.warning(`Synchronizacja zakończona z ${errorCount} błędami.`);
      } else {
        toast.success(`Synchronizacja zakończona pomyślnie (${successCount} zmian).`);
      }

    } catch (err) {
      toast.dismiss();
      toast.error(`Krytyczny błąd synchronizacji: ${err.message}`);
      console.error("Krytyczny błąd synchronizacji (batch):", err.message);
    } finally {
      isSyncing = false; 
      const remainingJobs = await db.syncQueue.count();
      if (remainingJobs > 0 && navigator.onLine) {
        setTimeout(() => syncService.processSyncQueue(), 1000); 
      }
    }
  }
};

// === 3. WARSTWA REPOZYTORIUM (z Toastami) ===
export const repository = {
  
  getCowsQuery: () => db.cows.orderBy('name').toArray(),
  getCowQuery: (id) => db.cows.get(parseInt(id, 10)),
  getEventsQuery: (cowId) => db.events.where('cow').equals(parseInt(cowId, 10)).reverse().sortBy('date'),
  syncCows: () => networkApi.getCows().then(d => db.cows.bulkPut(d)).catch(e => console.warn("Sync: Jesteś offline (Cows)", e.message)),
  syncCow: (id) => networkApi.getCow(id).then(d => db.cows.put(d)).catch(e => console.warn("Sync: Jesteś offline (Cow)", e.message)),
  syncEvents: (cowId) => networkApi.getEventsForCow(cowId).then(d => db.transaction('rw', db.events, async () => { await db.events.where('cow').equals(cowId).delete(); await db.events.bulkPut(d); })).catch(e => console.warn("Sync: Jesteś offline (Events)", e.message)),
  searchCow: networkApi.searchCow,

  createCow: async (data) => {
    if (navigator.onLine) {
      try {
        const realCow = await networkApi.createCow(data);
        await db.cows.put(realCow);
        toast.success(`Krowa ${realCow.name} dodana pomyślnie.`);
        return realCow;
      } catch(e) { 
        toast.error(`Błąd: ${e.message}`);
        throw e; 
      }
    } else {
      const existing = await db.cows.where('tag_id').equals(data.tag_id).first();
      if (existing) { 
        toast.error(`Krowa z tagiem ${data.tag_id} już istnieje w lokalnej bazie.`);
        throw new Error(`Krowa z tagiem ${data.tag_id} już istnieje w lokalnej bazie.`); 
      }
      const tempId = -(Date.now());
      const optimisticCow = { ...data, id: tempId, photo: null }; 
      await db.cows.put(optimisticCow);
      await db.syncQueue.add({ action: 'createCow', tempId: tempId, payload: optimisticCow });
      toast.warning(`Krowa ${optimisticCow.name} dodana offline. Zostanie zsynchronizowana.`);
      return optimisticCow; 
    }
  },
  updateCow: async (id, data) => {
    if (navigator.onLine) {
      const updatedCow = await networkApi.updateCow(id, data);
      await db.cows.put(updatedCow);
      toast.success(`Krowa ${updatedCow.name} zaktualizowana.`);
      return updatedCow;
    } else {
      if (data.tag_id) {
          const existing = await db.cows.where('tag_id').equals(data.tag_id).first();
          if (existing && existing.id !== id) {
             toast.error(`Krowa z tagiem ${data.tag_id} już istnieje w lokalnej bazie.`);
             throw new Error(`Krowa z tagiem ${data.tag_id} już istnieje w lokalnej bazie.`);
          }
      }
      await db.cows.update(id, data);
      await db.syncQueue.add({ action: 'updateCow', entityId: id, payload: data });
      toast.warning(`Krowa zaktualizowana offline. Zostanie zsynchronizowana.`);
    }
  },
  deleteCow: async (id) => {
    await db.cows.delete(id); 
    await db.events.where('cow').equals(id).delete(); 
    if (navigator.onLine) {
      try {
        await networkApi.deleteCow(id);
        toast.success("Krowa usunięta pomyślnie.");
      } catch (e) {
        toast.warning(`Krowa usunięta lokalnie, ale błąd na serwerze: ${e.message}`);
      }
    } else {
      toast.warning(`Krowa usunięta offline. Zostanie zsynchronizowana.`);
      if (id > 0) {
        await db.syncQueue.add({ action: 'deleteCow', entityId: id });
      }
    }
  },
  createEvent: async (data) => {
    const cowId = data.cow;
    if (navigator.onLine) {
      if (cowId < 0) {
        toast.error("Zsynchronizuj krowę przed dodaniem zdarzenia.");
        throw new Error("Nie można dodać zdarzenia online do krowy, która jest offline.");
      }
      const newEvent = await networkApi.createEvent(data);
      await db.events.put(newEvent);
      toast.success(`Zdarzenie ${newEvent.event_type} dodane pomyślnie.`);
      return newEvent;
    } else {
      const tempId = -(Date.now());
      const optimisticEvent = { ...data, id: tempId };
      await db.events.put(optimisticEvent);
      await db.syncQueue.add({ action: 'createEvent', tempId: tempId, payload: optimisticEvent });
      toast.warning(`Zdarzenie dodane offline. Zostanie zsynchronizowane.`);
      return optimisticEvent;
    }
  },
  uploadPhoto: networkApi.uploadPhoto,
};
export default repository;
