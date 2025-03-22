
import { MedicalRecord } from "@/types";

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (timeString: string): string => {
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${period}`;
};

export const generateTimeSlots = (startHour: number = 8, endHour: number = 17, interval: number = 30): string[] => {
  const timeSlots: string[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      timeSlots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  
  return timeSlots;
};

export const calculateAge = (dateOfBirthString: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirthString);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obesity";
};

export const getBMIColor = (bmi: number): string => {
  if (bmi < 18.5) return "text-blue-500";
  if (bmi < 25) return "text-green-500";
  if (bmi < 30) return "text-yellow-500";
  return "text-red-500";
};

// Add the missing function required by imports
export const getBMICategoryColor = (bmi: number): string => {
  if (bmi < 18.5) return "text-blue-500";
  if (bmi < 25) return "text-green-500";
  if (bmi < 30) return "text-yellow-500";
  return "text-red-500";
};

export const calculateBMITrend = (records: MedicalRecord[]): "increasing" | "decreasing" | "stable" | "unknown" => {
  if (records.length < 2) {
    return "unknown";
  }
  
  // Sort records by date, newest first
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const latestBMI = sortedRecords[0].bmi;
  const previousBMI = sortedRecords[1].bmi;
  
  const difference = latestBMI - previousBMI;
  
  if (Math.abs(difference) < 0.5) {
    return "stable";
  } else if (difference > 0) {
    return "increasing";
  } else {
    return "decreasing";
  }
};

export const getTrendIcon = (trend: "increasing" | "decreasing" | "stable" | "unknown"): string => {
  switch (trend) {
    case "increasing":
      return "arrow-up";
    case "decreasing":
      return "arrow-down";
    case "stable":
      return "arrow-right";
    default:
      return "help-circle";
  }
};

export const getTrendColor = (trend: "increasing" | "decreasing" | "stable" | "unknown", bmi: number): string => {
  if (trend === "unknown") {
    return "text-gray-500";
  }
  
  if (bmi < 18.5) {
    // Underweight
    return trend === "increasing" ? "text-green-500" : "text-red-500";
  } else if (bmi < 25) {
    // Normal weight
    return trend === "stable" ? "text-green-500" : "text-yellow-500";
  } else {
    // Overweight or obese
    return trend === "decreasing" ? "text-green-500" : "text-red-500";
  }
};
