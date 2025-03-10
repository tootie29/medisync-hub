
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const BMICalculator = () => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('');

  const calculateBMI = () => {
    if (!height || !weight) return;
    
    // Convert height from cm to meters and calculate BMI
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    
    if (heightInMeters <= 0 || weightInKg <= 0) {
      return;
    }
    
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    setBmi(parseFloat(bmiValue.toFixed(1)));
    
    // Determine BMI status
    if (bmiValue < 18.5) setStatus('Underweight');
    else if (bmiValue >= 18.5 && bmiValue < 25) setStatus('Normal weight');
    else if (bmiValue >= 25 && bmiValue < 30) setStatus('Overweight');
    else setStatus('Obesity');
  };

  const getBmiStatusColor = () => {
    if (!status) return 'text-gray-500';
    switch (status) {
      case 'Underweight': return 'text-blue-500';
      case 'Normal weight': return 'text-green-500';
      case 'Overweight': return 'text-yellow-500';
      case 'Obesity': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="medical-container py-12">
      <h1 className="page-title mb-8 flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        BMI Calculator
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calculate Your BMI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(e.target.value)} 
                placeholder="e.g. 175" 
              />
            </div>
            
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                placeholder="e.g. 70" 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-medical-primary hover:bg-medical-secondary"
              onClick={calculateBMI}
            >
              Calculate BMI
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center">
            {bmi ? (
              <>
                <div className="text-4xl font-bold mb-2">{bmi}</div>
                <div className={`text-xl font-semibold ${getBmiStatusColor()}`}>
                  {status}
                </div>
                <div className="mt-6 text-gray-600 max-w-md">
                  <p>BMI (Body Mass Index) is a measure of body fat based on height and weight that applies to adult men and women.</p>
                </div>
              </>
            ) : (
              <div className="text-gray-500">
                Enter your height and weight to calculate your BMI
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BMICalculator;
