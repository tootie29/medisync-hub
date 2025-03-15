
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { SAMPLE_USERS } from '@/types';

const PatientRecordsTable: React.FC = () => {
  const { medicalRecords } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique patient IDs from medical records
  const patientIds = [...new Set(medicalRecords.map(record => record.patientId))];
  
  // Map patient IDs to user data
  const patientData = patientIds
    .map(id => {
      const patient = SAMPLE_USERS.find(user => user.id === id);
      if (!patient) return null;
      
      // Only include patients/students/staff
      if (patient.role !== 'student' && patient.role !== 'staff') return null;
      
      // Count records for this patient
      const recordCount = medicalRecords.filter(record => record.patientId === id).length;
      
      // Get latest record date
      const latestRecord = medicalRecords
        .filter(record => record.patientId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      return {
        id: patient.id,
        name: patient.name,
        role: patient.role,
        recordCount,
        latestRecordDate: latestRecord ? latestRecord.date : '',
      };
    })
    .filter(Boolean); // Remove nulls
  
  // Filter patients based on search term
  const filteredPatients = searchTerm 
    ? patientData.filter(patient => 
        patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : patientData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search patients..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Record Count</TableHead>
                <TableHead>Latest Record</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map(patient => (
                  <TableRow key={patient?.id}>
                    <TableCell className="font-medium">{patient?.name}</TableCell>
                    <TableCell className="capitalize">{patient?.role}</TableCell>
                    <TableCell>{patient?.recordCount}</TableCell>
                    <TableCell>
                      {patient?.latestRecordDate 
                        ? formatDate(patient.latestRecordDate)
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/records?patient=${patient?.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Records
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No patients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientRecordsTable;
