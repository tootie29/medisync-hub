
export interface Vaccination {
  id: string;
  name: string;
  dateAdministered: string;
  doseNumber?: number;
  manufacturer?: string;
  lotNumber?: string;
  administeredBy?: string;
  notes?: string;
}

export interface VaccinationType {
  id: string;
  name: string;
  description?: string;
  recommendedDoses: number;
  intervalBetweenDoses?: string;
}

export const COMMON_VACCINATIONS: VaccinationType[] = [
  { id: 'covid-19', name: 'COVID-19', recommendedDoses: 2, intervalBetweenDoses: '3-4 weeks' },
  { id: 'hepatitis-b', name: 'Hepatitis B', recommendedDoses: 3, intervalBetweenDoses: '1-6 months' },
  { id: 'influenza', name: 'Influenza (Flu)', recommendedDoses: 1, intervalBetweenDoses: 'Annual' },
  { id: 'tetanus', name: 'Tetanus', recommendedDoses: 1, intervalBetweenDoses: '10 years' },
  { id: 'mmr', name: 'MMR (Measles, Mumps, Rubella)', recommendedDoses: 2, intervalBetweenDoses: '4 weeks' },
  { id: 'hpv', name: 'HPV (Human Papillomavirus)', recommendedDoses: 2, intervalBetweenDoses: '6-12 months' },
  { id: 'varicella', name: 'Varicella (Chickenpox)', recommendedDoses: 2, intervalBetweenDoses: '4-8 weeks' },
  { id: 'pneumococcal', name: 'Pneumococcal', recommendedDoses: 1, intervalBetweenDoses: '5 years' },
  { id: 'meningococcal', name: 'Meningococcal', recommendedDoses: 2, intervalBetweenDoses: '5 years' },
  { id: 'tuberculosis', name: 'Tuberculosis (BCG)', recommendedDoses: 1, intervalBetweenDoses: 'Once' }
];
