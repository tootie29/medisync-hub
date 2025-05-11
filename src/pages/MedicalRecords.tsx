import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Form } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MainLayout from '@/components/layout/MainLayout';
import { formatDate } from '@/utils/helpers';
import { MedicalRecord, User } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { ChevronLeft, Plus, FileText, Calendar, User as UserIcon, ClipboardList, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  date: z.date(),
  type: z.string().min(2, {
    message: "Medical record type must be at least 2 characters.",
  }),
  notes: z.string().optional(),
  certificateEnabled: z.boolean().default(false),
});

const MedicalRecords: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { medicalRecords, addMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = useData();
  const [patient, setPatient] = useState<User | null>(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isEditRecordOpen, setIsEditRecordOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isDeleteRecordOpen, setIsDeleteRecordOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState(false);

  const patientId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('patient');
  }, [location.search]);

  const action = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('action');
  }, [location.search]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      type: "",
      notes: "",
      certificateEnabled: false,
    },
  });

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;

      try {
        const getApiUrl = () => {
          const hostname = window.location.hostname;
          
          if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
            console.log('Using production API URL');
            return 'https://api.climasys.entrsolutions.com/api';
          }
          
          const envApiUrl = import.meta.env.VITE_API_URL;
          if (envApiUrl) {
            console.log('Using environment API URL:', envApiUrl);
            return envApiUrl;
          }
          
          console.log('Using localhost API URL');
          return 'http://localhost:8080/api';
        };
        
        const API_URL = getApiUrl();
        const response = await axios.get(`${API_URL}/users/${patientId}`);
        setPatient(response.data);
        setConnectionError(false);
      } catch (error) {
        console.error('Error fetching patient:', error);
        setPatient({
          id: patientId,
          name: 'Sample Patient',
          email: 'patient@example.com',
          role: 'student',
        });
        setConnectionError(true);
        toast.error('Unable to connect to the API server. Using sample data instead.');
      }
    };

    fetchPatient();
  }, [patientId]);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (action === 'add') {
      setIsAddRecordOpen(true);
    } else {
      setIsAddRecordOpen(false);
    }
  }, [action]);

  const getMedicalRecordsTitle = () => {
    if (patient) {
      return `Medical Records for ${patient.name}`;
    }
    return 'Medical Records';
  };

  const patientMedicalRecords = useMemo(() => {
    if (!patientId) return [];
    return medicalRecords.filter(record => record.patientId === patientId);
  }, [medicalRecords, patientId]);

  const handleAddRecord = async (values: z.infer<typeof formSchema>) => {
    if (!patientId) return;

    const newRecord: MedicalRecord = {
      id: `record-${Date.now()}`,
      patientId: patientId,
      date: values.date.toISOString(),
      type: values.type,
      notes: values.notes || '',
      certificateEnabled: values.certificateEnabled || false,
    };

    try {
      await addMedicalRecord(newRecord);
      toast.success('Medical record added successfully!');
      form.reset();
      setIsAddRecordOpen(false);
    } catch (error) {
      console.error('Error adding medical record:', error);
      toast.error('Failed to add medical record.');
    }
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    form.setValue('date', new Date(record.date));
    form.setValue('type', record.type);
    form.setValue('notes', record.notes || '');
    form.setValue('certificateEnabled', record.certificateEnabled || false);
    setIsEditRecordOpen(true);
  };

  const handleUpdateRecord = async (values: z.infer<typeof formSchema>) => {
    if (!selectedRecord) return;

    const updatedRecord: MedicalRecord = {
      ...selectedRecord,
      date: values.date.toISOString(),
      type: values.type,
      notes: values.notes || '',
      certificateEnabled: values.certificateEnabled || false,
    };

    try {
      await updateMedicalRecord(updatedRecord);
      toast.success('Medical record updated successfully!');
      form.reset();
      setIsEditRecordOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error updating medical record:', error);
      toast.error('Failed to update medical record.');
    }
  };

  const handleDeleteRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsDeleteRecordOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!selectedRecord) return;

    try {
      await deleteMedicalRecord(selectedRecord.id);
      toast.success('Medical record deleted successfully!');
      setIsDeleteRecordOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error deleting medical record:', error);
      toast.error('Failed to delete medical record.');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{getMedicalRecordsTitle()}</h1>
            <div className="flex space-x-2">
              <Button 
                asChild 
                variant="outline" 
                size="sm" 
                className="flex items-center"
              >
                <Link to="/dashboard">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              {(user?.role === 'doctor' || user?.role === 'head nurse') && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setIsAddRecordOpen(true)}
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Record
                </Button>
              )}
            </div>
          </div>
          
          {connectionError && (
            <div className="bg-destructive/15 p-3 rounded-md mb-4 flex justify-between items-center">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">API Connection Error</p>
                  <p className="text-sm text-destructive/80">
                    Unable to connect to the API server. Displaying limited or sample data.
                    The server may be down or experiencing issues.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] w-full rounded-md">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="certificate">Certificate Enabled</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="border-none p-4">
                    {patientMedicalRecords.length > 0 ? (
                      <div className="grid gap-4">
                        {patientMedicalRecords.map((record) => (
                          <Card key={record.id}>
                            <CardHeader>
                              <div className="flex items-center space-x-4">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <CardTitle>{record.type}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <p className="text-sm text-gray-500">
                                  <Calendar className="mr-2 inline-block h-4 w-4 align-middle" />
                                  {formatDate(record.date)}
                                </p>
                                {record.notes && (
                                  <p className="text-sm text-gray-500">
                                    <ClipboardList className="mr-2 inline-block h-4 w-4 align-middle" />
                                    {record.notes}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2">
                                  {record.certificateEnabled && (
                                    <Badge variant="secondary">Certificate Enabled</Badge>
                                  )}
                                </div>
                                <div className="flex justify-end space-x-2">
                                  {(user?.role === 'doctor' || user?.role === 'head nurse') && (
                                    <>
                                      <Button variant="outline" size="sm" onClick={() => handleEditRecord(record)}>
                                        Edit
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(record)}>
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        No medical records found.
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="certificate" className="border-none p-4">
                    {patientMedicalRecords.filter(record => record.certificateEnabled).length > 0 ? (
                      <div className="grid gap-4">
                        {patientMedicalRecords
                          .filter(record => record.certificateEnabled)
                          .map((record) => (
                            <Card key={record.id}>
                              <CardHeader>
                                <div className="flex items-center space-x-4">
                                  <FileText className="h-5 w-5 text-gray-500" />
                                  <CardTitle>{record.type}</CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-500">
                                    <Calendar className="mr-2 inline-block h-4 w-4 align-middle" />
                                    {formatDate(record.date)}
                                  </p>
                                  {record.notes && (
                                    <p className="text-sm text-gray-500">
                                      <ClipboardList className="mr-2 inline-block h-4 w-4 align-middle" />
                                      {record.notes}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2">
                                    {record.certificateEnabled && (
                                      <Badge variant="secondary">Certificate Enabled</Badge>
                                    )}
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    {(user?.role === 'doctor' || user?.role === 'head nurse') && (
                                      <>
                                        <Button variant="outline" size="sm" onClick={() => handleEditRecord(record)}>
                                          Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(record)}>
                                          Delete
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        No certificate-enabled medical records found.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </CardContent>
          </Card>

          <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Medical Record</DialogTitle>
                <DialogDescription>
                  Create a new medical record for the patient.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddRecord)} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      defaultValue={format(form.getValues("date"), "yyyy-MM-dd")}
                      onChange={(e) => form.setValue("date", new Date(e.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Input id="type" type="text" placeholder="e.g., Checkup" {...form.register("type")} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Additional notes" {...form.register("notes")} />
                  </div>
                  <div>
                    <Label htmlFor="certificateEnabled" className="flex items-center space-x-2">
                      <Input id="certificateEnabled" type="checkbox" className="h-4 w-4" {...form.register("certificateEnabled")} />
                      <span>Enable Certificate</span>
                    </Label>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Add Record</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditRecordOpen} onOpenChange={() => setIsEditRecordOpen(false)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Medical Record</DialogTitle>
                <DialogDescription>
                  Edit the selected medical record for the patient.
                </DialogDescription>
              </DialogHeader>
              {selectedRecord && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdateRecord)} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        defaultValue={format(form.getValues("date"), "yyyy-MM-dd")}
                        onChange={(e) => form.setValue("date", new Date(e.target.value))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Input id="type" type="text" placeholder="e.g., Checkup" {...form.register("type")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" placeholder="Additional notes" {...form.register("notes")} />
                    </div>
                    <div>
                      <Label htmlFor="certificateEnabled" className="flex items-center space-x-2">
                        <Input id="certificateEnabled" type="checkbox" className="h-4 w-4" {...form.register("certificateEnabled")} />
                        <span>Enable Certificate</span>
                      </Label>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Update Record</Button>
                    </div>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteRecordOpen} onOpenChange={() => setIsDeleteRecordOpen(false)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Medical Record</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this medical record? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setIsDeleteRecordOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteRecord}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
};

export default MedicalRecords;
