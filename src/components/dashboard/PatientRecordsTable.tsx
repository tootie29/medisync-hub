
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { User, SAMPLE_USERS } from '@/types';
import axios from 'axios';

const PatientRecordsTable: React.FC = () => {
  const { medicalRecords } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Function to fetch users from the API
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setConnectionError(false);
      const isPreviewMode = window.location.hostname.includes('lovableproject.com');
      
      if (isPreviewMode) {
        console.log('Running in preview mode - using sample data');
        // Filter out demo accounts
        const filteredUsers = SAMPLE_USERS.filter(user => 
          user.email !== 'admin@example.com' &&
          user.email !== 'doctor@example.com' &&
          user.email !== 'student@example.com' &&
          user.email !== 'staff@example.com'
        );
        setUsers(filteredUsers);
        setIsLoading(false);
        return;
      }

      try {
        // Get API URL using the same logic as in DataContext
        const getApiUrl = () => {
          const hostname = window.location.hostname;
          
          // Check if we're on the production domain
          if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
            console.log('Using production API URL');
            return 'https://api.climasys.entrsolutions.com/api';
          }
          
          // Check for environment variable
          const envApiUrl = import.meta.env.VITE_API_URL;
          if (envApiUrl) {
            console.log('Using environment API URL:', envApiUrl);
            return envApiUrl;
          }
          
          // Default to localhost
          console.log('Using localhost API URL');
          return 'http://localhost:8080/api';
        };
        
        const API_URL = getApiUrl();
        console.log('Fetching users from API:', API_URL);
        
        // Configure Axios with additional settings
        const response = await axios.get(`${API_URL}/users`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          timeout: 10000,
          withCredentials: false // Set to true only if using cookies for auth
        });
        
        console.log('Users fetched successfully:', response.data.length);
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setConnectionError(true);
        // Fallback to sample data if API fails
        setUsers(SAMPLE_USERS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users to only include patients (students and staff)
  const patientUsers = users.filter(user => 
    user && (user.role === 'student' || user.role === 'staff')
  );

  // Map patient data for display
  const patientData = patientUsers.map(patient => {
    // Count records for this patient
    const patientRecords = medicalRecords.filter(record => record.patientId === patient.id);
    const recordCount = patientRecords.length;
    
    // Get latest record date
    const latestRecord = patientRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return {
      id: patient.id,
      name: patient.name,
      role: patient.role,
      recordCount,
      latestRecordDate: latestRecord ? latestRecord.date : '',
    };
  });
  
  // Filter patients based on search term
  const filteredPatients = searchTerm 
    ? patientData.filter(patient => 
        patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : patientData;

  console.log("Available patients:", filteredPatients.length);

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
        
        {connectionError && (
          <div className="bg-destructive/15 p-3 rounded-md mb-4">
            <p className="text-sm text-destructive">
              Unable to connect to the API server. Using sample data instead.
              Please ensure the API server is running and CORS is properly configured.
            </p>
          </div>
        )}
        
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading patients...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length > 0 ? (
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
