import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartPulse, Calendar, Calculator, ClipboardCheck, Pill } from "lucide-react"; // Changed from Pills to Pill

export default function Index() {
  return (
    <div className="medical-container py-12">
      <h1 className="page-title">MediSync Hub</h1>
      <p className="mb-8">Your all-in-one platform for managing health records, appointments, and more.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Schedule and manage your appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Book appointments with doctors and view your upcoming schedule.</p>
            <Button asChild className="mt-4 w-full bg-medical-primary hover:bg-medical-secondary">
              <Link to="/appointments" className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Book Now
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical Records</CardTitle>
            <CardDescription>View and manage your medical records.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Access your medical history, lab results, and other important health information.</p>
            <Button asChild className="mt-4 w-full bg-medical-primary hover:bg-medical-secondary">
              <Link to="/medical-records" className="flex items-center justify-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                View Records
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>BMI Calculator</CardTitle>
            <CardDescription>Calculate your Body Mass Index (BMI).</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Calculate your BMI to assess your weight status and health risks.</p>
            <Button asChild className="mt-4 w-full bg-medical-primary hover:bg-medical-secondary">
              <Link to="/bmi" className="flex items-center justify-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculate BMI
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medicine Inventory</CardTitle>
            <CardDescription>Manage medicine inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Keep track of available medicines, quantities, and expiry dates.</p>
            <Button asChild className="mt-4 w-full bg-medical-primary hover:bg-medical-secondary">
              <Link to="/inventory" className="flex items-center justify-center gap-2">
                <Pill className="h-4 w-4" />
                View Inventory
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Monitoring</CardTitle>
            <CardDescription>Track your vital signs and health metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Monitor your heart rate, blood pressure, and other vital signs to stay on top of your health.</p>
            <Button asChild className="mt-4 w-full bg-medical-primary hover:bg-medical-secondary">
              <Link to="/health-monitoring" className="flex items-center justify-center gap-2">
                <HeartPulse className="h-4 w-4" />
                Monitor Health
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
