
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, LineChart as LineChartIcon, Activity, Heart } from "lucide-react";
import { toast } from "sonner";

// Sample data - in a real app, this would come from your backend
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

const HealthMonitoring = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("heart-rate");
  const [newReading, setNewReading] = useState({
    heartRate: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    bloodGlucose: "",
  });

  const handleAddReading = (type: string) => {
    // In a real app, this would send data to your backend
    toast.success(`New ${type} reading added!`, {
      description: "Your health data has been updated successfully.",
    });

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
                    data={healthData.heartRate}
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
                    data={healthData.bloodPressure}
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
                    data={healthData.bloodGlucose}
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

export default HealthMonitoring;
