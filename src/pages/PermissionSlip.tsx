
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Printer, User } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

const PermissionSlip: React.FC = () => {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [reason, setReason] = useState('Medical consultation completed. Student is cleared to return home.');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handlePrint = () => {
    if (!studentName.trim()) {
      alert('Please enter the student name before printing.');
      return;
    }
    
    const printContent = document.getElementById('permission-slip-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Permission Slip - ${studentName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 2px solid #ea580c;
              padding-bottom: 20px;
            }
            .logo { 
              max-height: 80px; 
              margin-bottom: 10px; 
            }
            .title { 
              color: #ea580c; 
              font-size: 28px; 
              font-weight: bold; 
              margin: 10px 0;
            }
            .content { 
              margin: 30px 0; 
              font-size: 16px;
            }
            .field { 
              margin: 15px 0; 
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .field strong { 
              color: #ea580c; 
            }
            .signature-section { 
              margin-top: 60px; 
              display: flex; 
              justify-content: space-between;
            }
            .signature-box { 
              width: 200px; 
              text-align: center;
            }
            .signature-line { 
              border-top: 1px solid #333; 
              margin-top: 40px; 
              padding-top: 5px;
            }
            .footer { 
              margin-top: 60px; 
              text-align: center; 
              font-size: 12px; 
              color: #666;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Allow both "doctor" role and "head nurse" role to access
  if (!user || (user.role !== "doctor" && user.role !== "head nurse")) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Access denied. Only doctors and head nurses can create permission slips.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-orange-600 mb-2">Permission Slip</h1>
            <p className="text-gray-600">Create permission note for student to go home</p>
          </div>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Permission Slip
          </Button>
        </div>

        {/* Input Form */}
        <Card className="border-orange-200 shadow-sm">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student's full name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Early Dismissal</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional instructions or notes"
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="border-orange-200 shadow-sm">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <FileText className="h-5 w-5" />
              Permission Slip Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div id="permission-slip-content" className="bg-white p-8 min-h-[600px]">
              {/* Header */}
              <div className="header">
                <img 
                  src="/lovable-uploads/03f574c6-5504-45d4-8d0e-3eb89db37d70.png" 
                  alt="Olivarez College" 
                  className="logo mx-auto"
                />
                <div className="title">PERMISSION SLIP</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Olivarez College - Health Services
                </div>
              </div>

              {/* Content */}
              <div className="content">
                <div className="field">
                  <strong>Date:</strong> {formatDate(new Date().toISOString())}
                </div>
                
                <div className="field">
                  <strong>Student Name:</strong> {studentName || '[Student Name]'}
                </div>
                
                <div className="field">
                  <strong>Time:</strong> {new Date().toLocaleTimeString()}
                </div>

                <div style={{ margin: '40px 0', fontSize: '16px' }}>
                  <p>To Whom It May Concern:</p>
                  
                  <p style={{ margin: '20px 0' }}>
                    This is to certify that <strong>{studentName || '[Student Name]'}</strong> has been 
                    examined by the school health service and is hereby given permission to leave 
                    the school premises.
                  </p>

                  <div className="field">
                    <strong>Reason:</strong> {reason}
                  </div>

                  {additionalNotes && (
                    <div className="field">
                      <strong>Additional Notes:</strong> {additionalNotes}
                    </div>
                  )}

                  <p style={{ margin: '30px 0' }}>
                    The student is cleared to go home and should follow any medical instructions 
                    provided during the consultation.
                  </p>
                </div>

                {/* Signature Section */}
                <div className="signature-section">
                  <div className="signature-box">
                    <div className="signature-line">
                      {user.name}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                      {user.role === 'doctor' ? 'School Doctor' : 'Head Nurse'}<br/>
                      Health Services Department
                    </div>
                  </div>
                  
                  <div className="signature-box">
                    <div className="signature-line">
                      Date & Time
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                      {formatDate(new Date().toISOString())}<br/>
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="footer">
                  <p>This permission slip is valid only for the date issued.</p>
                  <p>For inquiries, please contact the Health Services Department.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PermissionSlip;
