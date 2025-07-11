
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, AlertCircle, RefreshCw, FilePlus } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { User, SAMPLE_USERS } from '@/types';
import axios from 'axios';
import { toast } from 'sonner';

const PatientRecordsTable: React.FC = () => {
  const { medicalRecords } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [lastFetchAttempt, setLastFetchAttempt] = useState(Date.now());

  // Check if user is medical staff (specifically doctor or head nurse, NOT admin)
  const isMedicalStaff = user?.role === 'doctor' || user?.role === 'head nurse';

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
        setConnectionError(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setConnectionError(true);
        
        // Show toast notification for API error
        toast.error('Unable to connect to the API server. Using sample data instead.');
        
        // Fallback to sample data if API fails
        setUsers(SAMPLE_USERS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [lastFetchAttempt]);

  // Function to retry API connection
  const handleRetry = () => {
    setLastFetchAttempt(Date.now());
    toast.info('Attempting to reconnect to the API server...');
  };

  // Filter users to only include patients (students and staff)
  const patientUsers = users.filter(user => 
    user && (user.role === 'student' || user.role === 'staff')
  );

  // Map patient data for display
  const patientData = patientUsers.map(patient => {
    // Count records for this patient - ensure we check both original and prefixed ID formats
    const patientId = patient.id;
    const prefixedId = patientId.startsWith('user-') ? patientId : `user-${patientId}`;
    
    // Check records for both ID formats
    const patientRecords = medicalRecords.filter(record => 
      record.patientId === patientId || record.patientId === prefixedId
    );
    
    const recordCount = patientRecords.length;
    
    // Get latest record date and type
    const latestRecord = patientRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return {
      id: patient.id,
      name: patient.name,
      role: patient.role,
      recordCount,
      latestRecordDate: latestRecord ? latestRecord.date : '',
      latestRecordType: latestRecord ? latestRecord.type || 'General Checkup' : '',
    };
  });
  
  // Filter patients based on search term
  const filteredPatients = searchTerm 
    ? patientData.filter(patient => 
        patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : patientData;

  console.log("Available patients:", filteredPatients.length);
  console.log("Current user role:", user?.role);
  console.log("Is medical staff (not admin):", isMedicalStaff);

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
          <div className="bg-destructive/15 p-3 rounded-md mb-4 flex justify-between items-center">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">API Connection Error</p>
                <p className="text-sm text-destructive/80">
                  Unable to connect to the API server. Using sample data instead.
                  The server may be down or experiencing issues.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Record Count</TableHead>
                <TableHead>Latest Visit</TableHead>
                <TableHead>Visit Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading patients...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map(patient => {
                  // Always ensure patient ID includes the prefix for URL params
                  const patientUrlId = patient?.id.startsWith('user-') 
                    ? patient?.id 
                    : `user-${patient?.id}`;
                  
                  console.log(`Patient: ${patient?.name}, ID: ${patient?.id}, URL ID: ${patientUrlId}`);
                    
                  return (
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
                      <TableCell>
                        {patient?.latestRecordType || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/medical-records?patient=${patientUrlId}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Records
                          </Link>
                        </Button>
                        {/* Only show Add Record button for doctors and head nurses (NOT admin) */}
                        {isMedicalStaff && (
                          <Button 
                            asChild 
                            size="sm" 
                            variant="outline"
                            className="ml-2"
                          >
                            <Link to={`/medical-records?patient=${patientUrlId}&action=add`}>
                              <FilePlus className="h-4 w-4 mr-2" />
                              Add Record
                            </Link>
                          </Button>
                        )}
                        {isMedicalStaff && (
                          <Button 
                            asChild 
                            size="sm" 
                            variant="outline"
                            className="ml-2"
                          >
                            <Link to={`/appointments`}>
                              Appointments
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
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
