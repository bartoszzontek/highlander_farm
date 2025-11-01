import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export function CowForm({ cow, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    tag_id: '',
    name: '',
    breed: 'Highland Cattle',
    birth_date: '',
    gender: 'F',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cow) {
      setFormData({
        tag_id: cow.tag_id || '',
        name: cow.name || '',
        breed: cow.breed || 'Highland Cattle',
        birth_date: cow.birth_date || '',
        gender: cow.gender || 'F',
      });
    }
  }, [cow]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.tag_id.trim()) {
      newErrors.tag_id = 'Numer kolczyka jest wymagany';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Imię jest wymagane';
    }
    
    if (!formData.birth_date) {
      newErrors.birth_date = 'Data urodzenia jest wymagana';
    } else {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birth_date = 'Data urodzenia nie może być w przyszłości';
      }
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
      {/* Tag ID */}
      <div>
        <Label htmlFor="tag_id">Numer kolczyka *</Label>
        <Input
          id="tag_id"
          name="tag_id"
          value={formData.tag_id}
          onChange={handleChange}
          placeholder="np. PL001"
          disabled={loading}
        />
        {errors.tag_id && (
          <p className="text-sm text-red-600 mt-1">{errors.tag_id}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="name">Imię *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="np. Bella"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Breed */}
      <div>
        <Label htmlFor="breed">Rasa</Label>
        <Input
          id="breed"
          name="breed"
          value={formData.breed}
          onChange={handleChange}
          placeholder="Highland Cattle"
          disabled={loading}
        />
      </div>

      {/* Birth Date */}
      <div>
        <Label htmlFor="birth_date">Data urodzenia *</Label>
        <Input
          id="birth_date"
          name="birth_date"
          type="date"
          value={formData.birth_date}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.birth_date && (
          <p className="text-sm text-red-600 mt-1">{errors.birth_date}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <Label htmlFor="gender">Płeć *</Label>
        <Select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="F">Samica (♀)</option>
          <option value="M">Samiec (♂)</option>
        </Select>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            cow ? 'Zaktualizuj' : 'Dodaj krowę'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
