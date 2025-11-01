import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export function DeleteCowDialog({ cow, open, onOpenChange, onConfirm, loading, error }) {
  if (!cow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Czy na pewno usunąć krowę?</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ta akcja jest nieodwracalna. Krowa zostanie trwale usunięta z bazy danych.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold">{cow.name}</p>
            <p className="text-sm text-gray-600">Tag: {cow.tag_id}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                'Usuń krowę'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Anuluj
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
