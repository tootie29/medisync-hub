
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
  console.log('User details course:', userDetails?.course);
  console.log('User details department:', userDetails?.department);
  console.log('User details studentId:', userDetails?.studentId);
  console.log('Medical records found:', medicalRecords.length);
  console.log('Medical records data:', medicalRecords);
  
  // Get latest medical record - find the most recent by date
  let latestRecord = null;
  if (medicalRecords && medicalRecords.length > 0) {
    console.log('=== GETTING LATEST RECORD ===');
    console.log('Total records:', medicalRecords.length);
    
    // Sort records by date to find the most recent one
    const sortedRecords = [...medicalRecords].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.date || b.createdAt || b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
    
    latestRecord = sortedRecords[0]; // First item is the most recent
    
    console.log('Selected LATEST record (most recent by date):', {
      id: latestRecord.id,
      bmi: latestRecord.bmi,
      weight: latestRecord.weight,
      height: latestRecord.height,
      date: latestRecord.date || latestRecord.createdAt || latestRecord.updatedAt
    });
    
    // Log all records for debugging
    console.log('All records sorted by date (newest first):');
    sortedRecords.forEach((record, index) => {
      console.log(`Record ${index}:`, {
        id: record.id,
        date: record.date || record.createdAt || record.updatedAt,
        bmi: record.bmi,
        weight: record.weight,
        height: record.height,
        isSelected: index === 0
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

  console.log('=== VACCINATION DEBUG ===');
  console.log('Total vaccination records:', allVaccinations.length);
  console.log('All vaccinations:', allVaccinations.map(v => ({
    name: v.name,
    dateAdministered: v.dateAdministered,
    doseNumber: v.doseNumber,
    lotNumber: v.lotNumber
  })));

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
                    {userDetails.studentId && (
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        <strong>Student ID:</strong> {userDetails.studentId}
                      </p>
                    )}
                    <Badge variant="outline" className="mb-2 capitalize">
                      {userDetails.role}
                    </Badge>
                    
                    {userDetails.role === 'student' && (
                      <div className="text-sm text-gray-600 space-y-1 mb-2">
                        {userDetails.course && (
                          <p><strong>Course:</strong> {userDetails.course}</p>
                        )}
                        {userDetails.department && (
                          <p><strong>Department:</strong> {userDetails.department}</p>
                        )}
                        {userDetails.faculty && (
                          <p><strong>Faculty:</strong> {userDetails.faculty}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span>{userDetails.address || 'Address not provided'}</span>
                    </div>
                    
                    <div className="space-y-2">
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
                        <span>Born: {userDetails.birthDate || userDetails.dateOfBirth ? formatDate(userDetails.birthDate || userDetails.dateOfBirth) : 'Not provided'}</span>
                      </div>
                    </div>
                    
                    {userDetails.department && userDetails.role !== 'student' && (
                      <p className="mt-2"><strong>Department:</strong> {userDetails.department}</p>
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
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Syringe className="h-5 w-5" />
                VACCINATION RECORD
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-orange-300">
                  <thead>
                    <tr className="bg-orange-100">
                      <th className="border border-orange-300 p-2 text-left font-semibold text-sm">VACCINE</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">DOSE</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">1</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">2</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">3</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">4</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">5</th>
                      <th className="border border-orange-300 p-2 text-left font-semibold text-sm">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                     {[
                       'COVID-19',
                       'HEPATITIS B', 
                       'INFLUENZA (FLU)',
                       'TETANUS',
                       'MMR (MEASLES, MUMPS, RUBELLA)',
                       'HPV (HUMAN PAPILLOMAVIRUS)',
                       'VARICELLA (CHICKENPOX)',
                       'PNEUMOCOCCAL',
                       'MENINGOCOCCAL',
                       'TUBERCULOSIS (BCG)'
                     ].map((vaccineName) => {
                       // Find records that match this vaccine type with flexible matching
                       const vaccineRecords = allVaccinations.filter(v => {
                         const vName = v.name.toUpperCase().trim();
                         const searchName = vaccineName.toUpperCase().trim();
                         
                         // Flexible matching for different naming conventions
                         return vName.includes(searchName) || 
                                searchName.includes(vName) ||
                                vName.includes(searchName.split(' ')[0]) ||
                                (searchName.includes('COVID') && vName.includes('COVID')) ||
                                (searchName.includes('HEPATITIS') && vName.includes('HEPATITIS')) ||
                                (searchName.includes('INFLUENZA') && (vName.includes('FLU') || vName.includes('INFLUENZA'))) ||
                                (searchName.includes('FLU') && (vName.includes('FLU') || vName.includes('INFLUENZA'))) ||
                                (searchName.includes('TETANUS') && vName.includes('TETANUS')) ||
                                (searchName.includes('MMR') && vName.includes('MMR')) ||
                                (searchName.includes('MEASLES') && vName.includes('MEASLES')) ||
                                (searchName.includes('MUMPS') && vName.includes('MUMPS')) ||
                                (searchName.includes('RUBELLA') && vName.includes('RUBELLA')) ||
                                (searchName.includes('HPV') && vName.includes('HPV')) ||
                                (searchName.includes('PAPILLOMAVIRUS') && vName.includes('PAPILLOMAVIRUS')) ||
                                (searchName.includes('VARICELLA') && (vName.includes('VARICELLA') || vName.includes('CHICKENPOX'))) ||
                                (searchName.includes('CHICKENPOX') && (vName.includes('VARICELLA') || vName.includes('CHICKENPOX'))) ||
                                (searchName.includes('PNEUMOCOCCAL') && (vName.includes('PNEUMOCOCCAL') || vName.includes('PNEUMO'))) ||
                                (searchName.includes('MENINGOCOCCAL') && (vName.includes('MENINGOCOCCAL') || vName.includes('MENINGO'))) ||
                                (searchName.includes('TUBERCULOSIS') && (vName.includes('TUBERCULOSIS') || vName.includes('BCG'))) ||
                                (searchName.includes('BCG') && (vName.includes('TUBERCULOSIS') || vName.includes('BCG')));
                       });
                       
                       return (
                         <React.Fragment key={vaccineName}>
                           <tr>
                             <td className="border border-orange-300 p-2 font-medium text-sm bg-orange-50" rowSpan={3}>
                               {vaccineName}
                             </td>
                             <td className="border border-orange-300 p-2 text-xs text-center">DATE GIVEN</td>
                             {[1, 2, 3, 4, 5].map(doseNum => {
                               // Get the record for this dose position (not necessarily by doseNumber)
                               const doseRecord = vaccineRecords[doseNum - 1]; // Use array index for dose position
                               return (
                                 <td key={doseNum} className="border border-orange-300 p-1 text-xs text-center">
                                   {doseRecord ? formatDate(doseRecord.dateAdministered).split(' ')[0] : ''}
                                 </td>
                               );
                             })}
                             <td className="border border-orange-300 p-2 text-xs" rowSpan={3}>
                               {vaccineRecords.map(v => v.notes).filter(Boolean).join('; ') || ''}
                             </td>
                           </tr>
                           <tr>
                              <td className="border border-orange-300 p-2 text-xs text-center">SIG.</td>
                              {[1, 2, 3, 4, 5].map(doseNum => {
                                const doseRecord = vaccineRecords[doseNum - 1]; // Use array index for position
                                return (
                                  <td key={doseNum} className="border border-orange-300 p-1 text-xs text-center">
                                    {doseRecord ? '✓' : ''}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr>
                              <td className="border border-orange-300 p-2 text-xs text-center">LOT</td>
                              {[1, 2, 3, 4, 5].map(doseNum => {
                                const doseRecord = vaccineRecords[doseNum - 1]; // Use array index for position
                                return (
                                  <td key={doseNum} className="border border-orange-300 p-1 text-xs text-center">
                                    {doseRecord?.lotNumber || ''}
                                  </td>
                                );
                              })}
                           </tr>
                         </React.Fragment>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </CardContent>
           </Card>

          {/* Laboratory Tests */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <TestTube className="h-5 w-5" />
                MEDICAL LABORATORY RESULTS RECORD
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-orange-300">
                  <thead>
                    <tr className="bg-orange-100">
                      <th className="border border-orange-300 p-2 text-left font-semibold text-sm">TESTS</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">DATE<br/>RESULT</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">DATE<br/>RESULT</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">DATE<br/>RESULT</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">DATE<br/>RESULT</th>
                      <th className="border border-orange-300 p-2 text-center font-semibold text-sm">DATE<br/>RESULT</th>
                      <th className="border border-orange-300 p-2 text-left font-semibold text-sm">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                     {['Chest X-ray', 'Complete Blood Count', 'Urinalysis', 'Fecalysis', 'Hepatitis B Screening'].map((testName) => {
                       const testRecords = allLaboratoryTests
                         .filter(test => 
                           test.testName.toLowerCase().includes(testName.toLowerCase()) ||
                           testName.toLowerCase().includes(test.testName.toLowerCase())
                         )
                         .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()) // Sort by date (oldest first)
                         .slice(0, 5); // Show up to 5 records for each test type
                      
                      return (
                        <tr key={testName}>
                          <td className="border border-orange-300 p-2 font-medium text-sm bg-orange-50">
                            {testName}
                          </td>
                          {[0, 1, 2, 3, 4].map(index => {
                            const testRecord = testRecords[index];
                            return (
                              <td key={index} className="border border-orange-300 p-1 text-xs text-center">
                                {testRecord ? (
                                  <div>
                                    <div className="font-medium">{formatDate(testRecord.testDate).split(' ')[0]}</div>
                                    <div className="text-green-600">{testRecord.result}</div>
                                  </div>
                                ) : ''}
                              </td>
                            );
                          })}
                          <td className="border border-orange-300 p-2 text-xs">
                            {testRecords.map(test => test.remarks).filter(Boolean).join('; ') || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {allLaboratoryTests.length === 0 && (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No laboratory tests recorded</p>
                  <p className="text-sm text-gray-400">
                    Laboratory test results will appear here once tests are completed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
