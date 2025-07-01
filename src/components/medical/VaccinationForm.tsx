import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vaccination, VaccinationType, COMMON_VACCINATIONS } from '@/types/vaccination';
import { Trash2, Plus, Syringe } from 'lucide-react';
import { toast } from 'sonner';

interface VaccinationFormProps {
  vaccinations: Vaccination[];
  onVaccinationsChange: (vaccinations: Vaccination[]) => void;
  disabled?: boolean;
}

const VaccinationForm: React.FC<VaccinationFormProps> = ({
  vaccinations,
  onVaccinationsChange,
  disabled = false
}) => {
  const [newVaccination, setNewVaccination] = useState<Partial<Vaccination>>({
    name: '',
    dateAdministered: '',
    doseNumber: 1,
    manufacturer: '',
    lotNumber: '',
    administeredBy: '',
    notes: ''
  });

  const generateId = () => `vaccination-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAddVaccination = () => {
    if (!newVaccination.name || !newVaccination.dateAdministered) {
      toast.error('Please select a vaccination and enter the date administered');
      return;
    }

    const vaccination: Vaccination = {
      id: generateId(),
      name: newVaccination.name,
      dateAdministered: newVaccination.dateAdministered,
      doseNumber: newVaccination.doseNumber || 1,
      manufacturer: newVaccination.manufacturer || '',
      lotNumber: newVaccination.lotNumber || '',
      administeredBy: newVaccination.administeredBy || '',
      notes: newVaccination.notes || ''
    };

    onVaccinationsChange([...vaccinations, vaccination]);
    
    // Reset form
    setNewVaccination({
      name: '',
      dateAdministered: '',
      doseNumber: 1,
      manufacturer: '',
      lotNumber: '',
      administeredBy: '',
      notes: ''
    });

    toast.success('Vaccination added successfully');
  };

  const handleRemoveVaccination = (id: string) => {
    onVaccinationsChange(vaccinations.filter(v => v.id !== id));
    toast.success('Vaccination removed');
  };

  const handleVaccinationChange = (id: string, field: keyof Vaccination, value: any) => {
    const updatedVaccinations = vaccinations.map(v =>
      v.id === id ? { ...v, [field]: value } : v
    );
    onVaccinationsChange(updatedVaccinations);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Syringe className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Vaccinations</h3>
      </div>

      {/* Existing Vaccinations */}
      {vaccinations.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Current Vaccinations</Label>
          {vaccinations.map((vaccination) => (
            <Card key={vaccination.id} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{vaccination.name}</CardTitle>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVaccination(vaccination.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {vaccination.dateAdministered}
                  </div>
                  <div>
                    <span className="font-medium">Dose:</span> {vaccination.doseNumber}
                  </div>
                  {vaccination.manufacturer && (
                    <div>
                      <span className="font-medium">Manufacturer:</span> {vaccination.manufacturer}
                    </div>
                  )}
                  {vaccination.lotNumber && (
                    <div>
                      <span className="font-medium">Lot Number:</span> {vaccination.lotNumber}
                    </div>
                  )}
                  {vaccination.administeredBy && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Administered by:</span> {vaccination.administeredBy}
                    </div>
                  )}
                  {vaccination.notes && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Notes:</span> {vaccination.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Vaccination Form */}
      {!disabled && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Vaccination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaccination-name">Vaccination *</Label>
                <Select
                  value={newVaccination.name}
                  onValueChange={(value) => setNewVaccination(prev => ({ ...prev, name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vaccination" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_VACCINATIONS.map((vaccine) => (
                      <SelectItem key={vaccine.id} value={vaccine.name}>
                        {vaccine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vaccination-date">Date Administered *</Label>
                <Input
                  id="vaccination-date"
                  type="date"
                  value={newVaccination.dateAdministered}
                  onChange={(e) => setNewVaccination(prev => ({ ...prev, dateAdministered: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="dose-number">Dose Number</Label>
                <Input
                  id="dose-number"
                  type="number"
                  min="1"
                  value={newVaccination.doseNumber}
                  onChange={(e) => setNewVaccination(prev => ({ ...prev, doseNumber: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="e.g., Pfizer, Moderna"
                  value={newVaccination.manufacturer}
                  onChange={(e) => setNewVaccination(prev => ({ ...prev, manufacturer: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="lot-number">Lot Number</Label>
                <Input
                  id="lot-number"
                  placeholder="Vaccine lot number"
                  value={newVaccination.lotNumber}
                  onChange={(e) => setNewVaccination(prev => ({ ...prev, lotNumber: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="administered-by">Administered By</Label>
                <Input
                  id="administered-by"
                  placeholder="Healthcare provider name"
                  value={newVaccination.administeredBy}
                  onChange={(e) => setNewVaccination(prev => ({ ...prev, administeredBy: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vaccination-notes">Notes</Label>
              <Textarea
                id="vaccination-notes"
                placeholder="Additional notes about the vaccination"
                value={newVaccination.notes}
                onChange={(e) => setNewVaccination(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Button
              type="button"
              onClick={handleAddVaccination}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vaccination
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VaccinationForm;
