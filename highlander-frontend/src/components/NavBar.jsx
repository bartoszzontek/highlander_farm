// src/components/NavBar.jsx
import { NavLink } from 'react-router-dom';
import { List, QrCode, RefreshCw, LogOut } from 'lucide-react'; // <-- Import LogOut
import { cn } from '../lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { syncService } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // <-- Import useAuth

export function NavBar() {
  const commonStyle = "flex flex-col items-center justify-center h-16 w-full text-gray-500 rounded-none transition-colors duration-200";
  const activeStyle = "bg-emerald-50 text-emerald-700 font-semibold border-t-2 border-emerald-500";
  
  const syncQueueCount = useLiveQuery(() => db.syncQueue.count(), [], 0);
  const { logout } = useAuth(); // <-- Pobierz funkcję logout

  const handleSyncClick = () => {
    console.log("Ręczna synchronizacja...");
    syncService.processSyncQueue();
  };

  return (
    // === ZMIANA: grid-cols-4 ===
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 grid grid-cols-4 shadow-inner">
      {/* 1. Lista */}
      <NavLink 
        to="/" 
        end
        className={({ isActive }) => cn(commonStyle, isActive && activeStyle)}
      >
        <List className="w-6 h-6 mb-1" />
        <span className="text-xs">Stado</span>
      </NavLink>
      
      {/* 2. Skaner */}
      <NavLink 
        to="/scan" 
        className={({ isActive }) => cn(commonStyle, isActive && activeStyle)}
      >
        <QrCode className="w-6 h-6 mb-1" />
        <span className="text-xs">Skanuj</span>
      </NavLink>

      {/* 3. Przycisk Synchronizacji */}
      <button 
        onClick={handleSyncClick}
        className={cn(commonStyle, "relative")}
      >
        {syncQueueCount > 0 && (
          <div className="absolute top-2 right-[25%] w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {syncQueueCount}
          </div>
        )}
        <RefreshCw className={cn("w-6 h-6 mb-1", syncQueueCount > 0 && "text-blue-600 animate-spin-slow")} />
        <span className="text-xs">Synchronizuj</span>
      </button>
      
      {/* 4. Przycisk Wyloguj (NOWY) */}
      <button 
        onClick={logout}
        className={cn(commonStyle, "text-red-500 hover:bg-red-50")}
      >
        <LogOut className="w-6 h-6 mb-1" />
        <span className="text-xs">Wyloguj</span>
      </button>
    </nav>
  );
}
