// src/components/EventForm.jsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';

export function EventForm({ cowId, onSubmit, onCancel, loading }) {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    cow: cowId,
    event_type: 'KONTROLA',
    date: today,
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.date) {
      newErrors.date = 'Data jest wymagana';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Event Type */}
      <div>
        <Label htmlFor="event_type">Typ zdarzenia *</Label>
        <Select
          id="event_type"
          name="event_type"
          value={formData.event_type}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="LECZENIE">Leczenie</option>
          <option value="SZCZEPIENIE">Szczepienie</option>
          <option value="WYCIELENIE">Wycielenie</option>
          <option value="KONTROLA">Kontrola</option>
          <option value="INNE">Inne</option>
        </Select>
      </div>
      
      {/* Date */}
      <div>
        <Label htmlFor="date">Data zdarzenia *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.date && (
          <p className="text-sm text-red-600 mt-1">{errors.date}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notatki</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Dodatkowe informacje..."
          disabled={loading}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Zapisywanie...
            </>
          ) : 'Dodaj zdarzenie'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
