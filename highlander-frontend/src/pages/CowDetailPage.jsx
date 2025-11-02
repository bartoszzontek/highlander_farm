// src/pages/CowDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks'; 
import { repository, syncService } from '../services/api'; 
import { db } from '../db'; 
import { Loader2, AlertCircle, ArrowLeft, Calendar, Tag, Edit2, Trash2, PlusCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { EventTimeline } from '../components/EventTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { CowForm } from '../components/CowForm';
import { DeleteCowDialog } from '../components/DeleteCowDialog';
import { AddEventDialog } from '../components/AddEventDialog';
import { toast } from 'sonner'; // <-- IMPORT TOAST

export function CowDetailPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const numericId = parseInt(id, 10);
  
  const cow = useLiveQuery(() => repository.getCowQuery(numericId), [numericId], undefined);
  const events = useLiveQuery(() => repository.getEventsQuery(numericId), [numericId], undefined);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const syncQueueCount = useLiveQuery(() => db.syncQueue.count(), [], 0);

  useEffect(() => {
    const runSync = () => {
      if (navigator.onLine) syncService.processSyncQueue();
    };
    window.addEventListener('online', runSync);
    if (numericId > 0) {
      repository.syncCow(numericId);
      repository.syncEvents(numericId);
    }
    return () => window.removeEventListener('online', runSync);
  }, [numericId]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  const closeAllDialogs = () => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setIsEventDialogOpen(false);
    setPhotoFile(null);
  };

  const handleEditCow = async (formData) => {
    if (!cow) return;
    try {
      setFormLoading(true);
      const { photo, ...dataToSend } = formData;
      await repository.updateCow(cow.id, dataToSend);
      if (photoFile && cow.id && navigator.onLine) {
        await repository.uploadPhoto(cow.id, photoFile);
      }
      closeAllDialogs();
    } catch (err) {
      toast.error(err.message); // <-- UŻYJ TOAST
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCow = async () => {
    if (!cow) return;
    try {
      setFormLoading(true);
      await repository.deleteCow(cow.id);
      closeAllDialogs();
      navigate('/'); 
    } catch (err) {
      toast.error(err.message); // <-- UŻYJ TOAST
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleAddEvent = async (eventData) => {
    try {
      setFormLoading(true);
      await repository.createEvent(eventData); 
      closeAllDialogs();
    } catch (err) {
      toast.error(err.message); // <-- UŻYJ TOAST
    } finally {
      setFormLoading(false);
    }
  };

  if (cow === undefined || events === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }
  
  if (!cow) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-2xl mx-auto text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isOnline ? "Nie znaleziono krowy." : "Brak połączenia i krowa nie była zapisana lokalnie."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć
        </Button>
      </div>
    );
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pl-PL');
  const ageLabel = (age) => (age === 1 ? 'rok' : (age >= 2 && age <= 4 ? 'lata' : 'lat'));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć do listy
        </Button>

        {!isOnline && (
          <Alert variant="destructive" className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Jesteś offline. Zmiany zostaną zapisane lokalnie.
            </AlertDescription>
          </Alert>
        )}
        {isOnline && syncQueueCount > 0 && (
           <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
             <RefreshCw className="h-4 w-4 animate-spin" />
             <AlertDescription>
               Synchronizowanie {syncQueueCount} {syncQueueCount === 1 ? 'zmiany' : 'zmian'}...
             </AlertDescription>
           </Alert>
        )}

        <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-4">
              {cow.photo ? (
                <img src={cow.photo} alt={cow.name} className="w-full h-80 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-80 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                  <span className="text-8xl">🐄</span>
                </div>
              )}
              {cow.id < 0 && (
                  <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600">
                      <CloudOff className="w-4 h-4 mr-1" />
                      Krowa niezsynchronizowana
                  </Badge>
              )}
            </div>
            
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{cow.name}</h1>
                  <Badge variant={cow.gender === 'F' ? 'default' : 'secondary'} className="text-lg">
                    {cow.gender === 'F' ? '♀ Samica' : '♂ Samiec'}
                  </Badge>
                </div>
                
                <div className="space-y-3 mt-4 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-foreground">Tag:</span>
                    <span className="font-mono text-lg bg-emerald-100 dark:bg-emerald-900 px-2 py-1 rounded text-emerald-700 dark:text-emerald-300">
                      {cow.tag_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-foreground">Ur.:</span>
                    <span>{formatDate(cow.birth_date)} ({(cow.age || '?')} {ageLabel(cow.age || 0)})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground ml-8">Rasa:</span>
                    <span>{cow.breed}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <Button onClick={() => setIsEventDialogOpen(true)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Dodaj zdarzenie
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edytuj
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-foreground mb-6">Historia zdarzeń</h2>
        <EventTimeline events={events} />

        {/* --- Dialogi --- */}
        <AddEventDialog
          cow={cow}
          open={isEventDialogOpen}
          onOpenChange={setIsEventDialogOpen}
          onSubmit={handleAddEvent}
          loading={formLoading}
          error={null}
        />
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent onClose={closeAllDialogs}>
            <DialogHeader><DialogTitle>Edytuj krowę</DialogTitle></DialogHeader>
            <CowForm
              cow={cow}
              onSubmit={handleEditCow}
              onCancel={closeAllDialogs}
              loading={formLoading}
              onPhotoChange={setPhotoFile} 
            />
          </DialogContent>
        </Dialog>
        <DeleteCowDialog
          cow={cow}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteCow}
          loading={formLoading}
          error={null}
        />
      </div>
    </div>
  );
}
