import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LaboratoryTest } from '@/types';
import { Plus, Trash2, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LaboratoryTestFormProps {
  laboratoryTests: LaboratoryTest[];
  onLaboratoryTestsChange: (tests: LaboratoryTest[]) => void;
  disabled?: boolean;
}

// Define the laboratory tests based on the image provided
const PREDEFINED_TESTS = [
  'Chest X-ray',
  'Complete Blood Count',
  'Urinalysis',
  'Fecalysis',
  'Hepatitis B Screening'
];

const LaboratoryTestForm: React.FC<LaboratoryTestFormProps> = ({
  laboratoryTests,
  onLaboratoryTestsChange,
  disabled = false
}) => {
  const [newTest, setNewTest] = useState<Partial<LaboratoryTest>>({
    testName: '',
    testDate: new Date().toISOString().split('T')[0],
    result: '',
    remarks: '',
    normalRange: ''
  });

  const addLaboratoryTest = () => {
    if (!newTest.testName || !newTest.testDate || !newTest.result) {
      toast.error('Test name, date, and result are required');
      return;
    }

    const laboratoryTest: LaboratoryTest = {
      id: `lab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testName: newTest.testName,
      testDate: newTest.testDate,
      result: newTest.result,
      remarks: newTest.remarks || '',
      normalRange: newTest.normalRange || ''
    };

    onLaboratoryTestsChange([...laboratoryTests, laboratoryTest]);
    
    // Reset form
    setNewTest({
      testName: '',
      testDate: new Date().toISOString().split('T')[0],
      result: '',
      remarks: '',
      normalRange: ''
    });

    toast.success('Laboratory test added successfully');
  };

  const removeLaboratoryTest = (id: string) => {
    onLaboratoryTestsChange(laboratoryTests.filter(test => test.id !== id));
    toast.success('Laboratory test removed');
  };

  const handleInputChange = (field: keyof LaboratoryTest, value: string) => {
    setNewTest(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-500" />
          Medical Laboratory Tests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display existing laboratory tests */}
        {laboratoryTests.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Added Tests:</h4>
            {laboratoryTests.map((test) => (
              <div key={test.id} className="bg-blue-50 p-3 rounded-md border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">{test.testName}</p>
                    <p className="text-sm text-blue-600">
                      Date: {format(new Date(test.testDate), 'PPP')} • Result: {test.result}
                    </p>
                    {test.normalRange && (
                      <p className="text-sm text-blue-600">Normal Range: {test.normalRange}</p>
                    )}
                    {test.remarks && (
                      <p className="text-sm text-blue-600">Remarks: {test.remarks}</p>
                    )}
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLaboratoryTest(test.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!disabled && (
          <>
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700 mb-3">Add New Laboratory Test:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testName">Test Name</Label>
                  <select
                    id="testName"
                    className="w-full p-2 border rounded-md text-sm"
                    value={newTest.testName}
                    onChange={(e) => handleInputChange('testName', e.target.value)}
                  >
                    <option value="">Select a test</option>
                    {PREDEFINED_TESTS.map((test) => (
                      <option key={test} value={test}>{test}</option>
                    ))}
                    <option value="other">Other (specify below)</option>
                  </select>
                  {newTest.testName === 'other' && (
                    <Input
                      placeholder="Enter test name"
                      className="mt-2"
                      onChange={(e) => handleInputChange('testName', e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="testDate">Test Date</Label>
                  <Input
                    id="testDate"
                    type="date"
                    value={newTest.testDate}
                    onChange={(e) => handleInputChange('testDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="result">Result</Label>
                  <Input
                    id="result"
                    placeholder="e.g., Normal, Abnormal, 120 mg/dL"
                    value={newTest.result}
                    onChange={(e) => handleInputChange('result', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="normalRange">Normal Range (Optional)</Label>
                  <Input
                    id="normalRange"
                    placeholder="e.g., 70-110 mg/dL"
                    value={newTest.normalRange}
                    onChange={(e) => handleInputChange('normalRange', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Additional notes or observations"
                    value={newTest.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={addLaboratoryTest}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Laboratory Test
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LaboratoryTestForm;