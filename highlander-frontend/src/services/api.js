// src/services/api.js
import { db } from '../db';
import { authService } from './auth';
import { toast } from 'sonner';

// Zmieniono na ścieżkę relatywną, aby zapytania trafiały do Nginxa na tym samym adresie
const API_BASE_URL = '/api';

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
    authService.logout(); throw new Error("Sesja wygasła.");
  }
  return response;
};

const handleResponse = async (response) => {
  if (response.ok && response.headers.get('Content-Type')?.includes('spreadsheet')) {
    return response.blob();
  }
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      if (response.status === 0 || !response.status) throw new Error('Nie można połączyć z serwerem API.');
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
  getStats: async () => handleResponse(await authedFetch(`${API_BASE_URL}/cows/stats/`)),
  getCows: async () => handleResponse(await authedFetch(`${API_BASE_URL}/cows/`)),
  getCow: async (id) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/${id}/`)),
  searchCow: async (tagId) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/search/?tag_id=${tagId}`)),
  getEventsForCow: async (cowId) => handleResponse(await authedFetch(`${API_BASE_URL}/events/?cow=${cowId}`)),
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start) params.append('due_date__gte', filters.start);
    if (filters.end) params.append('due_date__lte', filters.end);
    if (filters.cow) params.append('cow', filters.cow);
    if (filters.is_completed !== undefined) params.append('is_completed', String(filters.is_completed));
    return handleResponse(await authedFetch(`${API_BASE_URL}/tasks/?${params.toString()}`));
  },
  getPedigree: async (id) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/${id}/pedigree/`)),
  getDocuments: async (cowId) => handleResponse(await authedFetch(`${API_BASE_URL}/documents/?cow=${cowId}`)),
  getHerds: async () => handleResponse(await authedFetch(`${API_BASE_URL}/herds/`)),
  importExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return handleResponse(await authedFetch(`${API_BASE_URL}/cows/import-excel/`, { method: 'POST', body: formData }));
  },
  exportExcel: async () => handleResponse(await authedFetch(`${API_BASE_URL}/cows/export-excel/`)),
  createCow: async (data) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/`, { method: 'POST', body: JSON.stringify(data) })),
  updateCow: async (id, data) => handleResponse(await authedFetch(`${API_BASE_URL}/cows/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })),
  deleteCow: async (id) => {
    const response = await authedFetch(`${API_BASE_URL}/cows/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Błąd archiwizacji krowy');
    return true;
  },
  uploadPhoto: async (id, file) => {
    const formData = new FormData(); formData.append('photo', file);
    return handleResponse(await authedFetch(`${API_BASE_URL}/cows/${id}/upload_photo/`, { method: 'POST', body: formData }));
  },
  deleteDocument: async (id) => handleResponse(await authedFetch(`${API_BASE_URL}/documents/${id}/`, { method: 'DELETE' })),
  uploadDocument: async (cowId, title, file) => {
    const formData = new FormData(); formData.append('cow', cowId); formData.append('title', title); formData.append('file', file);
    return handleResponse(await authedFetch(`${API_BASE_URL}/documents/`, { method: 'POST', body: formData }));
  },
  createEvent: async (data) => handleResponse(await authedFetch(`${API_BASE_URL}/events/`, { method: 'POST', body: JSON.stringify(data) })),
  createTask: async (data) => handleResponse(await authedFetch(`${API_BASE_URL}/tasks/`, { method: 'POST', body: JSON.stringify(data) })),
  updateTask: async (id, data) => handleResponse(await authedFetch(`${API_BASE_URL}/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })),
  deleteTask: async (id) => handleResponse(await authedFetch(`${API_BASE_URL}/tasks/${id}/`, { method: 'DELETE' })),
  syncBatch: async (jobs) => {
    const response = await authedFetch(`${API_BASE_URL}/sync/`, { method: 'POST', body: JSON.stringify({ jobs }) });
    const data = await response.json();
    if (!response.ok) { throw new Error(data.message || 'Błąd serwera synchronizacji'); }
    return data;
  },
  getUsers: async () => handleResponse(await authedFetch(`${API_BASE_URL}/users/`)),
  createUser: async (data) => handleResponse(await authedFetch(`${API_BASE_URL}/users/`, { method: 'POST', body: JSON.stringify(data) })),
  updateUser: async (id, data) => handleResponse(await authedFetch(`${API_BASE_URL}/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })),
  deleteUser: async (id) => handleResponse(await authedFetch(`${API_BASE_URL}/users/${id}/`, { method: 'DELETE' })),
  setUserPassword: async (id, password) => handleResponse(await authedFetch(`${API_BASE_URL}/users/${id}/set-password/`, { method: 'POST', body: JSON.stringify({ password }) })),
};

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
      await db.transaction('rw', db.cows, db.events, db.tasks, db.documents, db.herds, db.syncQueue, async () => {
        for (const result of results) {
          const originalJob = jobs.find(j => j.id === result.queueId);
          if (!originalJob) continue;
          if (result.status === 'ok' || result.status === 'merged') {
            if (result.action === 'createCow' && result.realId) {
              await db.cows.update(result.tempId, { id: result.realId });
              await db.syncQueue.where('payload.cow').equals(result.tempId).modify({ 'payload.cow': result.realId });
              await db.events.where('cow').equals(result.tempId).modify({ cow: result.realId });
              await db.tasks.where('cow').equals(result.tempId).modify({ cow: result.realId });
              await db.documents.where('cow').equals(result.tempId).modify({ cow: result.realId });
            }
            if (result.action === 'createEvent' && result.realId) {
              await db.events.update(result.tempId, { id: result.realId });
            }
            if (result.action === 'createTask' && result.realId) {
              await db.tasks.update(result.tempId, { id: result.realId });
            }
            await db.syncQueue.delete(originalJob.id);
          } else {
            await db.syncQueue.delete(originalJob.id);
            if (result.action === 'createCow' && (result.error.includes('unique') || result.error.includes('IntegrityError'))) {
              await db.cows.delete(result.tempId);
              toast.error(`BŁĄD: Krowa ${originalJob.payload.tag_id} już istnieje.`);
            }
            else { toast.error(`Błąd synchronizacji ${result.action}.`); }
          }
        }
      });
      toast.dismiss();
      if (jobs.length > 0) toast.success(`Synchronizacja zakończona.`);
    } catch (err) {
      toast.dismiss();
      toast.error(`Błąd synchronizacji: ${err.message}`);
    } finally {
      isSyncing = false;
    }
  }
};

export const repository = {
  getCowsQuery: (status = 'ACTIVE', herd = 'ALL') => {
    let query = db.cows;
    if (status !== 'ALL') { query = query.where('status').equals(status); }
    if (herd !== 'ALL' && herd) {
        query = query.where('herd').equals(parseInt(herd, 10));
    }
    return query.toArray(async (cows) => {
      const damIds = [...new Set(cows.map(c => c.dam).filter(Boolean))];
      const sireIds = [...new Set(cows.map(c => c.sire).filter(Boolean))];
      const herdIds = [...new Set(cows.map(c => c.herd).filter(Boolean))];
      const parents = await db.cows.where('id').anyOf([...damIds, ...sireIds]).toArray();
      const herds = await db.herds.where('id').anyOf(herdIds).toArray();
      const parentsMap = new Map(parents.map(p => [p.id, p.name]));
      const herdsMap = new Map(herds.map(h => [h.id, h.name]));
      return cows.map(cow => ({
        ...cow,
        dam_name: parentsMap.get(cow.dam) || null,
        sire_name: parentsMap.get(cow.sire) || null,
        herd_name: herdsMap.get(cow.herd) || null,
      })).sort((a, b) => a.tag_id.localeCompare(b.tag_id));
    });
  },
  getHerdsQuery: () => db.herds.orderBy('name').toArray(),
  getPotentialParentsQuery: () => db.cows.where('status').equals('ACTIVE').toArray(),
  getCowQuery: (id) => db.cows.get(parseInt(id, 10)),
  getEventsQuery: (cowId) => db.events.where('cow').equals(parseInt(cowId, 10)).reverse().sortBy('date'),
  getTasksQuery: (filters = {}) => {
    let query = db.tasks;
    if (filters.cow) query = query.where('cow').equals(parseInt(filters.cow, 10));
    if (filters.is_completed !== undefined) query = query.where('is_completed').equals(filters.is_completed ? 1 : 0);
    return query.reverse().sortBy('due_date');
  },
  getTasksForCalendarQuery: () => db.tasks.toArray(),
  getPedigree: networkApi.getPedigree,
  getDocumentsQuery: (cowId) => db.documents.where('cow').equals(parseInt(cowId, 10)).sortBy('uploaded_at'),

  syncCows: () => networkApi.getCows().then(d => db.cows.bulkPut(d)).catch(e => console.warn("Sync: Cows offline")),
  syncHerds: () => networkApi.getHerds().then(d => db.herds.bulkPut(d)).catch(e => console.warn("Sync: Herds offline")),
  syncCow: (id) => networkApi.getCow(id).then(d => db.cows.put(d)).catch(e => console.warn("Sync: Cow offline")),
  syncEvents: (cowId) => networkApi.getEventsForCow(cowId).then(d => db.transaction('rw', db.events, async () => { await db.events.where('cow').equals(cowId).delete(); await db.events.bulkPut(d); })),
  syncTasks: (filters = {}) => networkApi.getTasks(filters).then(d => db.tasks.bulkPut(d)),
  syncDocuments: (cowId) => networkApi.getDocuments(cowId).then(d => db.transaction('rw', db.documents, async () => { await db.documents.where('cow').equals(cowId).delete(); await db.documents.bulkPut(d); })),

  searchCow: networkApi.searchCow,

  createCow: async (data) => {
    const payload = { ...data, dam: data.dam || null, sire: data.sire || null, herd: data.herd || null };
    if (navigator.onLine) {
      const realCow = await networkApi.createCow(payload);
      await db.cows.put(realCow);
      return realCow;
    } else {
      const tempId = -(Date.now());
      const optimisticCow = { ...payload, id: tempId, photo: null };
      await db.cows.put(optimisticCow);
      await db.syncQueue.add({ action: 'createCow', tempId: tempId, payload: optimisticCow });
      return optimisticCow;
    }
  },
  updateCow: async (id, data) => {
    const payload = { ...data, dam: data.dam || null, sire: data.sire || null, herd: data.herd || null };
    if (navigator.onLine) {
      const updatedCow = await networkApi.updateCow(id, payload);
      await db.cows.put(updatedCow);
      return updatedCow;
    } else {
      await db.cows.update(id, payload);
      await db.syncQueue.add({ action: 'updateCow', entityId: id, payload: payload });
    }
  },
  archiveCow: async (id) => {
    await db.cows.update(id, { status: 'ARCHIVED' });
    if (navigator.onLine) {
      await networkApi.deleteCow(id);
    } else {
      if (id > 0) await db.syncQueue.add({ action: 'deleteCow', entityId: id });
    }
  },
  createEvent: async (data) => {
    if (navigator.onLine) {
      const newEvent = await networkApi.createEvent(data);
      await db.events.put(newEvent);
      return newEvent;
    } else {
      const tempId = -(Date.now());
      const optimisticEvent = { ...data, id: tempId };
      await db.events.put(optimisticEvent);
      await db.syncQueue.add({ action: 'createEvent', tempId: tempId, payload: optimisticEvent });
      return optimisticEvent;
    }
  },
  createTask: async (data) => {
    const payload = { ...data, cow: data.cow || null };
    if (navigator.onLine) {
      const newTask = await networkApi.createTask(payload);
      await db.tasks.put(newTask);
      return newTask;
    } else {
      const tempId = -(Date.now());
      const optimisticTask = { ...payload, id: tempId, is_completed: false };
      await db.tasks.put(optimisticTask);
      await db.syncQueue.add({ action: 'createTask', tempId: tempId, payload: optimisticTask });
      return optimisticTask;
    }
  },
  updateTask: async (id, data) => {
    const payload = { ...data };
    if (payload.is_completed !== undefined) payload.is_completed = payload.is_completed ? 1 : 0;
    if (navigator.onLine) {
      const updatedTask = await networkApi.updateTask(id, payload);
      await db.tasks.put(updatedTask);
      return updatedTask;
    } else {
      await db.tasks.update(id, payload);
      await db.syncQueue.add({ action: 'updateTask', entityId: id, payload: payload });
    }
  },
  deleteTask: async (id) => {
    await db.tasks.delete(id);
    if (navigator.onLine) await networkApi.deleteTask(id);
    else if (id > 0) await db.syncQueue.add({ action: 'deleteTask', entityId: id });
  },
  uploadDocument: networkApi.uploadDocument,
  deleteDocument: async (id) => {
    await db.documents.delete(id);
    if (navigator.onLine) await networkApi.deleteDocument(id);
    else if (id > 0) await db.syncQueue.add({ action: 'deleteDocument', entityId: id });
  },
  importExcel: networkApi.importExcel,
  exportExcel: async () => {
    const blob = await networkApi.exportExcel();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "stado_export.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  },
  uploadPhoto: networkApi.uploadPhoto,
  admin: networkApi,
};

export default repository;