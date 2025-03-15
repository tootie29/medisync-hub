
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, LineChartIcon, Activity, Heart } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const HealthMonitoring = () => {
  const { user } = useAuth();
  const { 
    getMedicalRecordsByPatientId, 
    getUserById, 
    medicalRecords, 
    addMedicalRecord,
    updateMedicalRecord,
    getMedicalRecordById
  } = useData();
  const [activeTab, setActiveTab] = useState("heart-rate");
  const [newReading, setNewReading] = useState({
    heartRate: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    bloodGlucose: "",
  });
  const [patientData, setPatientData] = useState({
    heartRate: [],
    bloodPressure: [],
    bloodGlucose: [],
  });

  // Transform medical records into chart data format
  useEffect(() => {
    if (!user) return;

    const userRecords = getMedicalRecordsByPatientId(user.id);
    
    // Sort records by date (newest first)
    const sortedRecords = [...userRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Extract and format the data for charts
    const heartRateData = [];
    const bloodPressureData = [];
    const bloodGlucoseData = [];

    sortedRecords.forEach(record => {
      const date = format(new Date(record.date), "yyyy-MM-dd");
      
      // Add heart rate data if available
      if (record.vitalSigns?.heartRate) {
        heartRateData.push({
          date,
          value: record.vitalSigns.heartRate,
        });
      }
      
      // Add blood pressure data if available
      if (record.vitalSigns?.bloodPressure) {
        // Parse blood pressure like "120/80"
        const [systolic, diastolic] = record.vitalSigns.bloodPressure.split('/').map(Number);
        bloodPressureData.push({
          date,
          systolic,
          diastolic,
        });
      } else if (record.bloodPressure) {
        // Fall back to the direct bloodPressure field if vitalSigns.bloodPressure is not available
        const [systolic, diastolic] = record.bloodPressure.split('/').map(Number);
        bloodPressureData.push({
          date,
          systolic,
          diastolic,
        });
      }
      
      // Add blood glucose data if available
      if (record.vitalSigns?.bloodGlucose) {
        bloodGlucoseData.push({
          date,
          value: record.vitalSigns.bloodGlucose,
        });
      }
    });

    // Reverse the arrays to display oldest to newest in charts
    setPatientData({
      heartRate: heartRateData.reverse(),
      bloodPressure: bloodPressureData.reverse(),
      bloodGlucose: bloodGlucoseData.reverse(),
    });
  }, [user, medicalRecords]);

  const handleAddReading = (type) => {
    if (!user) {
      toast.error("You must be logged in to add readings");
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    let message = "";
    let vitalSigns = {};
    
    // Get the most recent medical record for today, if it exists
    const userRecords = getMedicalRecordsByPatientId(user.id);
    const todayRecord = userRecords.find(record => record.date === today);
    
    if (type === "heartRate") {
      const heartRate = Number(newReading.heartRate);
      message = `Heart Rate: ${heartRate} BPM`;
      vitalSigns = { heartRate };
    } else if (type === "bloodPressure") {
      const bloodPressure = `${newReading.bloodPressureSystolic}/${newReading.bloodPressureDiastolic}`;
      message = `Blood Pressure: ${bloodPressure} mmHg`;
      vitalSigns = { bloodPressure };
    } else if (type === "bloodGlucose") {
      const bloodGlucose = Number(newReading.bloodGlucose);
      message = `Blood Glucose: ${bloodGlucose} mg/dL`;
      vitalSigns = { bloodGlucose };
    }
    
    // If we have a record for today, update it
    if (todayRecord) {
      updateMedicalRecord(todayRecord.id, {
        vitalSigns: {
          ...todayRecord.vitalSigns,
          ...vitalSigns
        }
      });
      toast.success(`New ${type} reading added!`, {
        description: `${message}. Your health data has been updated in your medical record.`,
      });
    } else {
      // Create a new record for today
      // Get the user's most recent record for height/weight values
      const latestRecord = userRecords.length > 0 
        ? userRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;
      
      // Use latest values or defaults
      const height = latestRecord ? latestRecord.height : 170;
      const weight = latestRecord ? latestRecord.weight : 70;
      
      addMedicalRecord({
        patientId: user.id,
        doctorId: user.id, // Self-recorded
        date: today,
        height,
        weight,
        vitalSigns,
        diagnosis: "Self-recorded vital signs",
        notes: `Self-monitoring: ${message}`
      });
      
      toast.success(`New ${type} reading added!`, {
        description: `${message}. A new medical record has been created with your health data.`,
      });
    }

    // Reset the form fields
    setNewReading({
      ...newReading,
      [type]: "",
      ...(type === "bloodPressure" ? { 
        bloodPressureSystolic: "", 
        bloodPressureDiastolic: "" 
      } : {}),
    });
  };

  // Combine sample data with patient data
  const combinedData = {
    heartRate: [...healthData.heartRate, ...patientData.heartRate],
    bloodPressure: [...healthData.bloodPressure, ...patientData.bloodPressure],
    bloodGlucose: [...healthData.bloodGlucose, ...patientData.bloodGlucose],
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Health Monitoring</h1>
            <p className="text-muted-foreground">Track and monitor your vital health metrics</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="heart-rate">Heart Rate</TabsTrigger>
            <TabsTrigger value="blood-pressure">Blood Pressure</TabsTrigger>
            <TabsTrigger value="blood-glucose">Blood Glucose</TabsTrigger>
          </TabsList>

          <TabsContent value="heart-rate">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Heart Rate</CardTitle>
                <CardDescription>Monitor your heart rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={combinedData.heartRate}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="BPM"
                      stroke="#ef4444"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Historical Heart Rate Data</CardTitle>
                <CardDescription>Your previous heart rate readings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Heart Rate (BPM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientData.heartRate.length > 0 ? (
                        patientData.heartRate.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2">{item.value}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-2 text-center text-muted-foreground">
                            No heart rate data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Reading</CardTitle>
                <CardDescription>Record your current heart rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow">
                    <label className="text-sm font-medium mb-2 block">Heart Rate (BPM)</label>
                    <Input
                      type="number"
                      placeholder="Enter heart rate"
                      value={newReading.heartRate}
                      onChange={(e) => setNewReading({ ...newReading, heartRate: e.target.value })}
                    />
                  </div>
                  <Button
                    className="self-end"
                    onClick={() => handleAddReading("heartRate")}
                    disabled={!newReading.heartRate}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Reading
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blood-pressure">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Blood Pressure</CardTitle>
                <CardDescription>Monitor your blood pressure readings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={combinedData.bloodPressure}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      name="Systolic"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      name="Diastolic"
                      stroke="#8b5cf6"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Historical Blood Pressure Data</CardTitle>
                <CardDescription>Your previous blood pressure readings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Systolic (mmHg)</th>
                        <th className="p-2 text-left">Diastolic (mmHg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientData.bloodPressure.length > 0 ? (
                        patientData.bloodPressure.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2">{item.systolic}</td>
                            <td className="p-2">{item.diastolic}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-2 text-center text-muted-foreground">
                            No blood pressure data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Reading</CardTitle>
                <CardDescription>Record your current blood pressure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Systolic (mmHg)</label>
                      <Input
                        type="number"
                        placeholder="Enter systolic pressure"
                        value={newReading.bloodPressureSystolic}
                        onChange={(e) =>
                          setNewReading({ ...newReading, bloodPressureSystolic: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Diastolic (mmHg)</label>
                      <Input
                        type="number"
                        placeholder="Enter diastolic pressure"
                        value={newReading.bloodPressureDiastolic}
                        onChange={(e) =>
                          setNewReading({ ...newReading, bloodPressureDiastolic: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    className="self-end"
                    onClick={() => handleAddReading("bloodPressure")}
                    disabled={!newReading.bloodPressureSystolic || !newReading.bloodPressureDiastolic}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Reading
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blood-glucose">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Blood Glucose</CardTitle>
                <CardDescription>Monitor your blood glucose levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={combinedData.bloodGlucose}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="mg/dL"
                      stroke="#10b981"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Historical Blood Glucose Data</CardTitle>
                <CardDescription>Your previous blood glucose readings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Blood Glucose (mg/dL)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientData.bloodGlucose.length > 0 ? (
                        patientData.bloodGlucose.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2">{item.value}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-2 text-center text-muted-foreground">
                            No blood glucose data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Reading</CardTitle>
                <CardDescription>Record your current blood glucose level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow">
                    <label className="text-sm font-medium mb-2 block">Blood Glucose (mg/dL)</label>
                    <Input
                      type="number"
                      placeholder="Enter blood glucose level"
                      value={newReading.bloodGlucose}
                      onChange={(e) => setNewReading({ ...newReading, bloodGlucose: e.target.value })}
                    />
                  </div>
                  <Button
                    className="self-end"
                    onClick={() => handleAddReading("bloodGlucose")}
                    disabled={!newReading.bloodGlucose}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Reading
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

// Sample data - this is combined with patient data from medical records
const healthData = {
  heartRate: [
    { date: "2023-10-01", value: 72 },
    { date: "2023-10-08", value: 75 },
    { date: "2023-10-15", value: 68 },
    { date: "2023-10-22", value: 71 },
    { date: "2023-10-29", value: 73 },
    { date: "2023-11-05", value: 70 },
  ],
  bloodPressure: [
    { date: "2023-10-01", systolic: 120, diastolic: 80 },
    { date: "2023-10-08", systolic: 122, diastolic: 82 },
    { date: "2023-10-15", systolic: 118, diastolic: 78 },
    { date: "2023-10-22", systolic: 121, diastolic: 79 },
    { date: "2023-10-29", systolic: 123, diastolic: 81 },
    { date: "2023-11-05", systolic: 119, diastolic: 80 },
  ],
  bloodGlucose: [
    { date: "2023-10-01", value: 92 },
    { date: "2023-10-08", value: 95 },
    { date: "2023-10-15", value: 90 },
    { date: "2023-10-22", value: 94 },
    { date: "2023-10-29", value: 91 },
    { date: "2023-11-05", value: 93 },
  ],
};

export default HealthMonitoring;
