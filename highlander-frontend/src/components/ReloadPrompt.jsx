// src/components/ReloadPrompt.jsx
// Komponent do obsługi aktualizacji PWA
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { DownloadCloud } from 'lucide-react';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker zarejestrowany:', r);
    },
    onRegisterError(error) {
      console.error('Błąd rejestracji Service Worker:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (offlineReady) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <Alert className="bg-emerald-600 text-white border-emerald-700 shadow-lg">
          <AlertDescription className="flex items-center gap-4">
            Aplikacja jest gotowa do pracy offline!
            <Button variant="outline" size="sm" onClick={close} className="text-emerald-700">
              OK
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (needRefresh) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <Alert className="bg-blue-600 text-white border-blue-700 shadow-lg">
          <AlertDescription className="flex items-center gap-4">
            <DownloadCloud className="w-5 h-5" />
            Dostępna jest nowa wersja aplikacji.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateServiceWorker(true)}
              className="text-blue-700"
            >
              Aktualizuj
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
