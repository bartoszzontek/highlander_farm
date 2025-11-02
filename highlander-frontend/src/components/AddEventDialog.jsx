// src/components/AddEventDialog.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { EventForm } from './EventForm';
import { AlertCircle } from 'lucide-react';

export function AddEventDialog({ cow, open, onOpenChange, onSubmit, loading, error }) {
  if (!cow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Dodaj zdarzenie dla: {cow.name}</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <EventForm
          cowId={cow.id}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
