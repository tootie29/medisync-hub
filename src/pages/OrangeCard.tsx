
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PDFShareDialog from '@/components/pdf/PDFShareDialog';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  Shield,
  Activity,
  FileText,
  Syringe,
  TestTube,
  Info
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import html2pdf from 'html2pdf.js';

const OrangeCard: React.FC = () => {
  const { user } = useAuth();
  const { getMedicalRecordsByPatientId, getUserById, isLoadingRecords } = useData();

  console.log('=== ORANGE CARD COMPONENT DEBUG ===');
  console.log('Current user from auth:', user);
  console.log('User ID:', user?.id);
  console.log('Is loading records:', isLoadingRecords);

  // Helper function to safely format BMI
  const formatBMI = (bmi: any): string => {
    if (typeof bmi === 'number' && !isNaN(bmi)) {
      return bmi.toFixed(1);
    }
    if (typeof bmi === 'string') {
      const parsed = parseFloat(bmi);
      if (!isNaN(parsed)) {
        return parsed.toFixed(1);
      }
    }
    return 'N/A';
  };

  const generatePDF = async (): Promise<Blob> => {
    const element = document.getElementById('orange-card-content');
    if (!element) {
      throw new Error('Orange card content not found');
    }

    // Configure PDF options
    const options = {
      margin: 1,
      filename: `orange-card-${userDetails?.name?.replace(/\s+/g, '-').toLowerCase() || 'patient'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      const pdf = await html2pdf().set(options).from(element).outputPdf('blob');
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view your Orange Card.</p>
        </div>
      </MainLayout>
    );
  }

  // Get user details and medical records
  const userDetails = getUserById(user.id) || user;
  const medicalRecords = getMedicalRecordsByPatientId(user.id);
  
  console.log('User details:', userDetails);
  console.log('Medical records found:', medicalRecords.length);
  console.log('Medical records data:', medicalRecords);
  
  // Get latest medical record - use the LAST record in the array (most recently inserted)
  let latestRecord = null;
  if (medicalRecords && medicalRecords.length > 0) {
    console.log('=== GETTING LATEST RECORD ===');
    console.log('Total records:', medicalRecords.length);
    
    // Use the LAST record in the array (most recently inserted)
    latestRecord = medicalRecords[medicalRecords.length - 1];
    
    console.log('Selected LATEST record (last in array):', {
      index: medicalRecords.length - 1,
      id: latestRecord.id,
      bmi: latestRecord.bmi,
      weight: latestRecord.weight,
      height: latestRecord.height,
      date: latestRecord.date || latestRecord.createdAt || latestRecord.updatedAt
    });
    
    // Log all records for debugging
    console.log('All records in order:');
    medicalRecords.forEach((record, index) => {
      console.log(`Record ${index}:`, {
        id: record.id,
        bmi: record.bmi,
        weight: record.weight,
        height: record.height,
        isSelected: index === medicalRecords.length - 1
      });
    });
  }

  console.log('Final latest record:', latestRecord);
  
  if (latestRecord) {
    console.log('Latest record details:', {
      id: latestRecord.id,
      patientId: latestRecord.patientId,
      bmi: latestRecord.bmi,
      weight: latestRecord.weight,
      height: latestRecord.height,
      date: latestRecord.date
    });
  } else {
    console.log('NO LATEST RECORD FOUND - latestRecord is null/undefined');
  }

  // Collect all vaccinations from all records
  const allVaccinations = medicalRecords && medicalRecords.length > 0
    ? medicalRecords
        .flatMap(record => record.vaccinations || [])
        .sort((a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime())
    : [];

  // Collect all laboratory tests from all records
  const allLaboratoryTests = medicalRecords && medicalRecords.length > 0
    ? medicalRecords
        .flatMap(record => record.laboratoryTests || [])
        .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
    : [];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header with Share Button - Fixed layout */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">Orange Card</h1>
            <p className="text-gray-600">Complete Health Summary</p>
          </div>
          <div className="flex-shrink-0">
            <PDFShareDialog 
              onGeneratePDF={generatePDF}
              patientName={userDetails?.name || 'Patient'}
            />
          </div>
        </div>

        {/* PDF Content Wrapper */}
        <div id="orange-card-content" className="space-y-6">
          {/* Personal Information Card */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userDetails.profilePicture} alt={userDetails.name} />
                  <AvatarFallback className="text-lg">
                    {userDetails.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{userDetails.name}</h3>
                    <Badge variant="outline" className="mb-2 capitalize">
                      {userDetails.role}
                    </Badge>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{userDetails.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{userDetails.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Born: {userDetails.birthDate || userDetails.dateOfBirth || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span>{userDetails.address || 'Address not provided'}</span>
                    </div>
                    
                    {userDetails.studentId && (
                      <p><strong>Student ID:</strong> {userDetails.studentId}</p>
                    )}
                    {userDetails.department && (
                      <p><strong>Department:</strong> {userDetails.department}</p>
                    )}
                    {userDetails.staffId && (
                      <p><strong>Staff ID:</strong> {userDetails.staffId}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Summary Card */}
          {isLoadingRecords ? (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Activity className="h-5 w-5" />
                  Latest Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading health records...</p>
                </div>
              </CardContent>
            </Card>
          ) : latestRecord ? (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Activity className="h-5 w-5" />
                  Latest Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatBMI(latestRecord.bmi)}
                    </div>
                    <div className="text-sm text-gray-600">BMI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {latestRecord.weight} kg
                    </div>
                    <div className="text-sm text-gray-600">Weight</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {latestRecord.height} cm
                    </div>
                    <div className="text-sm text-gray-600">Height</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {latestRecord.bloodPressure && (
                    <div>
                      <strong>Blood Pressure:</strong> {latestRecord.bloodPressure}
                    </div>
                  )}
                  {latestRecord.temperature && (
                    <div>
                      <strong>Temperature:</strong> {latestRecord.temperature}°C
                    </div>
                  )}
                  {latestRecord.vitalSigns?.heartRate && (
                    <div>
                      <strong>Heart Rate:</strong> {latestRecord.vitalSigns.heartRate} bpm
                    </div>
                  )}
                  {latestRecord.vitalSigns?.oxygenSaturation && (
                    <div>
                      <strong>Oxygen Saturation:</strong> {latestRecord.vitalSigns.oxygenSaturation}%
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <strong>Last Check-up:</strong> {formatDate(latestRecord.date || latestRecord.createdAt || latestRecord.updatedAt || new Date().toISOString())}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Activity className="h-5 w-5" />
                  Latest Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No medical records found</p>
                  <p className="text-sm text-gray-400">
                    Please visit the clinic to have your first health check-up recorded.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Allergies & Medical History */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                Allergies & Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Allergies</h4>
                  {userDetails.allergies && userDetails.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userDetails.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No known allergies</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Medical History</h4>
                  <p className="text-sm text-gray-600">
                    {userDetails.medicalHistory || 'No significant medical history'}
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h4 className="font-semibold mb-2">Insurance Information</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Provider:</strong> {userDetails.insuranceProvider || 'Not provided'}</p>
                  <p><strong>Policy Number:</strong> {userDetails.insurancePolicyNumber || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vaccination Records */}
          {allVaccinations.length > 0 && (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Syringe className="h-5 w-5" />
                  Vaccination Records
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {allVaccinations.map((vaccination, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-green-700">{vaccination.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(vaccination.dateAdministered)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {vaccination.doseNumber && (
                          <p><strong>Dose:</strong> {vaccination.doseNumber}</p>
                        )}
                        {vaccination.manufacturer && (
                          <p><strong>Manufacturer:</strong> {vaccination.manufacturer}</p>
                        )}
                        {vaccination.lotNumber && (
                          <p><strong>Lot Number:</strong> {vaccination.lotNumber}</p>
                        )}
                        {vaccination.administeredBy && (
                          <p><strong>Administered by:</strong> {vaccination.administeredBy}</p>
                        )}
                      </div>
                      
                      {vaccination.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Notes:</strong> {vaccination.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Laboratory Tests */}
          {allLaboratoryTests.length > 0 && (
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <TestTube className="h-5 w-5" />
                  Laboratory Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {allLaboratoryTests.map((test, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-blue-700">{test.testName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(test.testDate)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Result:</strong> {test.result}</p>
                        {test.normalRange && (
                          <p><strong>Normal Range:</strong> {test.normalRange}</p>
                        )}
                      </div>
                      
                      {test.remarks && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Remarks:</strong> {test.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Records Summary */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <FileText className="h-5 w-5" />
                Medical Records Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center mb-6">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {medicalRecords ? medicalRecords.length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {allVaccinations.length}
                  </div>
                  <div className="text-sm text-gray-600">Vaccinations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {allLaboratoryTests.length}
                  </div>
                  <div className="text-sm text-gray-600">Lab Tests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {latestRecord ? formatDate(latestRecord.date) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Last Visit</div>
                </div>
              </div>
              
              {(!medicalRecords || medicalRecords.length === 0) && !isLoadingRecords && (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No medical records found</p>
                  <p className="text-sm text-gray-400">
                    Your medical records will appear here after your first clinic visit.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrangeCard;
