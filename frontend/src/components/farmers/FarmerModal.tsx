import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Farmer, AnimalType } from '../../types';

export interface FarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (farmer: Partial<Farmer>) => void;
  initialData?: Farmer | null;
}

export const FarmerModal: React.FC<FarmerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [animalType, setAnimalType] = useState<AnimalType>('COW');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setMobile(initialData.mobile);
      setVillage(initialData.village);
      setAddress(initialData.address || '');
      setAnimalType(initialData.animalType);
      setNotes(initialData.notes || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setMobile('');
      setVillage('');
      setAddress('');
      setAnimalType('COW');
      setNotes('');
      setStatus('ACTIVE');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Farmer name is required';
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[+0-9\s-]{10,15}$/.test(mobile.trim())) {
      newErrors.mobile = 'Enter a valid 10-12 digit mobile number';
    }
    if (!village.trim()) newErrors.village = 'Village name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      mobile: mobile.trim(),
      village: village.trim(),
      address: address.trim(),
      animalType,
      notes: notes.trim(),
      status
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Farmer Record' : 'Register New Farmer'}
      description="Enter farmer personal, contact, and dairy herd profile information"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="e.g. Rameshwar Patil"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Mobile Number *"
            placeholder="+91 98765 43210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            error={errors.mobile}
          />
          <Input
            label="Village / Sector *"
            placeholder="e.g. Khed Shivapur"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            error={errors.village}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Primary Animal Type"
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value as AnimalType)}
            options={[
              { value: 'COW', label: 'Cow (Cow Dairy)' },
              { value: 'BUFFALO', label: 'Buffalo (High Fat)' },
              { value: 'MIXED', label: 'Mixed Dairy' },
              { value: 'GOAT', label: 'Caprine (Goat)' }
            ]}
          />
          <Select
            label="Membership Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
            options={[
              { value: 'ACTIVE', label: 'Active Member' },
              { value: 'INACTIVE', label: 'Inactive / Suspended' }
            ]}
          />
        </div>

        <Input
          label="Farm / Residential Address"
          placeholder="Plot No., Landmark, Street"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Operational Notes / Special Instructions
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Morning delivery only, A2 Gir cow herd..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-dairy-500 focus:outline-none focus:ring-2 focus:ring-dairy-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {initialData ? 'Save Changes' : 'Complete Registration'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
