// src/pages/ScannerPage.jsx
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Loader2, AlertCircle } from 'lucide-react';
import { CowScanner } from '../components/CowScanner';
import { CowCard } from '../components/CowCard';
import { repository } from '../services/api'; 
import { db } from '../db'; 
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { CowForm } from '../components/CowForm';
import { DeleteCowDialog } from '../components/DeleteCowDialog';
import { AddEventDialog } from '../components/AddEventDialog';
import { Input } from '../components/ui/input'; 
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export function ScannerPage() {
  const navigate = useNavigate(); 
  const [foundCow, setFoundCow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true); 
  const [manualTagId, setManualTagId] = useState(''); 

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
    if (!foundCow) return;
    try {
      setFormLoading(true);
      const { photo, ...dataToSend } = formData;
      await repository.updateCow(foundCow.id, dataToSend);
      if (photoFile && foundCow.id && navigator.onLine) {
        await repository.uploadPhoto(foundCow.id, photoFile);
      }
      setFoundCow(await db.cows.get(foundCow.id)); 
      closeAllDialogs();
    } catch (err) { toast.error(err.message); } 
    finally { setFormLoading(false); }
  };
  const handleDeleteCow = async () => {
    if (!foundCow) return;
    try {
      setFormLoading(true);
      await repository.deleteCow(foundCow.id);
      closeAllDialogs();
      resetScanner(); 
    } catch (err) { toast.error(err.message); } 
    finally { setFormLoading(false); }
  };
  const handleAddEvent = async (eventData) => {
    try {
      setFormLoading(true);
      await repository.createEvent(eventData); 
      closeAllDialogs();
    } catch (err) { toast.error(err.message); } 
    finally { setFormLoading(false); }
  };
  
  const openEditDialog = (cow) => {
    setPhotoFile(null); setIsEditDialogOpen(true);
  };
  const openDeleteDialog = (cow) => {
    setPhotoFile(null); setIsDeleteDialogOpen(true);
  };
  const openAddEventDialog = (cow) => {
    setIsEventDialogOpen(true); 
  };

  const handleScanResult = useCallback(async (tagId) => {
    if (loading) return;
    
    setIsScanning(false); 
    setLoading(true);
    setError(null);
    setFoundCow(null); 
    
    try {
      const data = await repository.searchCow(tagId);
      setFoundCow(data);
    } catch (err) {
      setError(err.message || "Nie znaleziono krowy");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const resetScanner = useCallback(() => {
    setFoundCow(null);
    setError(null);
    setLoading(false);
    setIsScanning(true);
    setManualTagId(''); 
    closeAllDialogs(); 
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualTagId.trim()) {
      handleScanResult(manualTagId.trim());
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      
      {loading && (
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Wyszukiwanie krowy o tagu...</p>
        </div>
      )}

      {error && !loading && (
        <div className="w-full max-w-md text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={resetScanner}>Skanuj ponownie</Button>
        </div>
      )}

      {foundCow && !loading && (
        <div className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-300">Znaleziono krowę!</h2>
          <CowCard 
            cow={foundCow} 
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onAddEvent={openAddEventDialog}
            onClick={() => navigate(`/cow/${foundCow.id}`)} 
            isOffline={foundCow.id < 0}
          />
          <Button onClick={resetScanner} className="mt-4">Skanuj ponownie</Button>
        </div>
      )}

      {isScanning && !loading && !error && !foundCow && (
        <div className="w-full max-w-md">
          <div className="w-full aspect-square rounded-lg overflow-hidden relative shadow-inner border-4 border-border bg-card">
            <CowScanner onResult={handleScanResult} scannerActive={isScanning} />
            <div className="absolute inset-0 flex flex-col items-center justify-between p-4 pointer-events-none">
              <p className="bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium">Nakieruj kamerę na kod QR</p>
              <div 
                className="absolute inset-0 border-4 border-red-500/50" 
                style={{ clipPath: 'polygon(0% 0%, 0% 20px, 20px 20px, 20px 0%, 100% 0%, 100% 20px, calc(100% - 20px) 20px, calc(100% - 20px) 0%, 0% 0%, 0% 100%, 20px 100%, 20px calc(100% - 20px), 0% calc(100% - 20px), 100% calc(100% - 20px), 100% 100%, calc(100% - 20px) 100%, calc(100% - 20px) calc(100% - 20px), 100% calc(100% - 20px), 100% 100%, 0% 100%)' }} 
              />
              <p className="text-white/80 text-sm bg-black/50 px-2 py-1 rounded">Oczekiwanie na skan...</p>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <span className="relative bg-background px-3 text-sm text-muted-foreground rounded-full">
              LUB
            </span>
          </div>
          
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <Label htmlFor="manualTagId" className="text-foreground font-semibold">Wpisz numer kolczyka ręcznie</Label>
              <Input
                id="manualTagId"
                placeholder="np. PL123456"
                value={manualTagId}
                onChange={(e) => setManualTagId(e.target.value.toUpperCase())}
                className="text-center text-lg mt-1"
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full">
              Szukaj
            </Button>
          </form>
        </div>
      )}

      {/* --- Dialogi --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent onClose={closeAllDialogs}>
          <DialogHeader><DialogTitle>Edytuj krowę</DialogTitle></DialogHeader>
          <CowForm cow={foundCow} onSubmit={handleEditCow} onCancel={closeAllDialogs} loading={formLoading} onPhotoChange={setPhotoFile} />
        </DialogContent>
      </Dialog>
      <DeleteCowDialog cow={foundCow} open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleDeleteCow} loading={formLoading} error={null} />
      <AddEventDialog cow={foundCow} open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen} onSubmit={handleAddEvent} loading={formLoading} error={null} />
    </div>
  );
}
