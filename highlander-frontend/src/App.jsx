// src/App.jsx
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { CowListPage } from './pages/CowListPage';
import { ScannerPage } from './pages/ScannerPage';
import { CowDetailPage } from './pages/CowDetailPage'; 
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavBar } from './components/NavBar';
import { Button } from './components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ReloadPrompt } from './components/ReloadPrompt'; 
import { useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner'; // <-- IMPORT TOASTER
import { ModeToggle } from './components/ModeToggle'; // <-- IMPORT TOGGLE

// Komponent Głównego Layoutu
function MainLayout() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const openAddDialog = () => setIsAddDialogOpen(true);

  const location = useLocation();
  const showAddButton = location.pathname === '/';
  const isDetailPage = location.pathname.startsWith('/cow/');

  if (isDetailPage) {
    return <Outlet />; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground"> {/* ZMIANA: Usunięto gradient, aby dark mode działał */}
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                🐄 Highlander Farm
              </h1>
              <p className="text-muted-foreground mt-1">Zarządzanie stadem krów Highland Cattle</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {showAddButton && (
                <Button onClick={openAddDialog} className="w-full sm:w-auto hidden sm:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj krowę
                </Button>
              )}
              <ModeToggle /> {/* <-- PRZYCISK DARK MODE */}
            </div>
          </div>
        </div>
      </div>

      <main className="pb-20"> 
        <Outlet context={{ isAddDialogOpen, setIsAddDialogOpen, openAddDialog }} />
      </main>

      <div>
        <NavBar />
      </div>
    </div>
  );
}

function App() {
  const { isLoggedIn } = useAuth(); 

  return (
    <> 
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<MainLayout />}>
            <Route index element={<CowListPage />} />
            <Route path="scan" element={<ScannerPage />} />
          </Route>
          <Route path="cow/:id" element={<CowDetailPage />} />
        </Route>
        <Route path="*" element={isLoggedIn ? <Navigate to="/" /> : <Navigate to="/login" />} />
      </Routes>
      
      <ReloadPrompt /> 
      <Toaster position="top-center" richColors /> {/* <-- GLOBALNY TOASTER */}
    </>
  );
}

export default App
