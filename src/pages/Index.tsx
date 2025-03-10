
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Calculator, Calendar, Pills, ClipboardList } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Book Appointment",
      description: "Schedule a medical consultation with our healthcare providers",
      icon: <Calendar className="w-12 h-12 text-medical-accent" />,
      path: "/appointments"
    },
    {
      title: "BMI Calculator",
      description: "Calculate and track your Body Mass Index",
      icon: <Calculator className="w-12 h-12 text-medical-accent" />,
      path: "/bmi"
    },
    {
      title: "Medical Records",
      description: "Access your medical history and health information",
      icon: <ClipboardList className="w-12 h-12 text-medical-accent" />,
      path: "/records"
    },
    {
      title: "Medicine Inventory",
      description: "Check available medications and supplies",
      icon: <Pills className="w-12 h-12 text-medical-accent" />,
      path: "/inventory"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="medical-container py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <HeartPulse className="w-16 h-16 text-medical-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-medical-primary mb-4">
            Medical Center Portal
          </h1>
          <p className="text-xl text-medical-secondary max-w-2xl mx-auto">
            Welcome to our medical center portal. Access healthcare services, manage appointments,
            and track your medical records all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                {feature.icon}
                <h3 className="text-xl font-semibold text-medical-primary mt-4 mb-2">
                  {feature.title}
                </h3>
                <p className="text-medical-secondary mb-4">
                  {feature.description}
                </p>
                <Button
                  onClick={() => navigate(feature.path)}
                  className="w-full bg-medical-accent hover:bg-medical-primary text-white"
                >
                  Access
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
