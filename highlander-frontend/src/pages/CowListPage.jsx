import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { CowCard } from '../components/CowCard';
import { CowForm } from '../components/CowForm';
import { DeleteCowDialog } from '../components/DeleteCowDialog';
import { api } from '../services/api';

export function CowListPage() {
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCow, setSelectedCow] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchCows();
  }, []);

  const fetchCows = async () => {
    try {
      setLoading(true);
      const data = await api.getCows();
      setCows(data.results || data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add cow
  const handleAddCow = async (formData) => {
    try {
      setFormLoading(true);
      setFormError(null);
      await api.createCow(formData);
      await fetchCows();
      setIsAddDialogOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit cow
  const handleEditCow = async (formData) => {
    try {
      setFormLoading(true);
      setFormError(null);
      await api.updateCow(selectedCow.id, formData);
      await fetchCows();
      setIsEditDialogOpen(false);
      setSelectedCow(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete cow
  const handleDeleteCow = async () => {
    try {
      setFormLoading(true);
      setFormError(null);
      await api.deleteCow(selectedCow.id);
      await fetchCows();
      setIsDeleteDialogOpen(false);
      setSelectedCow(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Open dialogs
  const openEditDialog = (cow) => {
    setSelectedCow(cow);
    setFormError(null);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cow) => {
    setSelectedCow(cow);
    setFormError(null);
    setIsDeleteDialogOpen(true);
  };

  const openAddDialog = () => {
    setFormError(null);
    setIsAddDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} - Upewnij się, że backend Django działa na localhost:8000
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🐄 Highlander Farm
              </h1>
              <p className="text-gray-600 mt-1">Zarządzanie stadem krów Highland Cattle</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {cows.length} {cows.length === 1 ? 'krowa' : cows.length < 5 ? 'krowy' : 'krów'}
              </Badge>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj krowę
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              Brak krów w bazie danych.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pierwszą krowę
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cows.map((cow) => (
              <CowCard
                key={cow.id}
                cow={cow}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onClick={() => console.log('View cow:', cow)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent onClose={() => setIsAddDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Dodaj nową krowę</DialogTitle>
          </DialogHeader>
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <CowForm
            onSubmit={handleAddCow}
            onCancel={() => setIsAddDialogOpen(false)}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent onClose={() => setIsEditDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edytuj krowę</DialogTitle>
          </DialogHeader>
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <CowForm
            cow={selectedCow}
            onSubmit={handleEditCow}
            onCancel={() => setIsEditDialogOpen(false)}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteCowDialog
        cow={selectedCow}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteCow}
        loading={formLoading}
        error={formError}
      />

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>Highlander Farm Management System v0.2</p>
      </div>
    </div>
  );
}