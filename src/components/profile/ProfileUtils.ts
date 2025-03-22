
// Import from main utils to maintain consistency
import { getBMICategory as getBMICategoryMain, getBMIColor } from '@/utils/helpers';

export const getBMICategory = getBMICategoryMain;

export const getBMICategoryColor = (bmi: number): string => {
  if (bmi < 18.5) return 'text-blue-500';
  if (bmi < 25) return 'text-green-500';
  if (bmi < 30) return 'text-yellow-500';
  return 'text-red-500';
};
