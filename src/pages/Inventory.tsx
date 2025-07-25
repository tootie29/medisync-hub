
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  AlertCircle, 
  Package, 
  PackagePlus, 
  PlusCircle, 
  RefreshCw,
  Trash2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import MainLayout from "@/components/layout/MainLayout";

const Inventory = () => {
  const { medicines, addMedicine, updateMedicine, deleteMedicine } = useData();
  const { user } = useAuth();
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    category: "",
    quantity: 0,
    threshold: 10,
    unit: "tablets",
    expiryDate: ""
  });
  const [updateQuantity, setUpdateQuantity] = useState<{ [key: string]: number }>({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<string | null>(null);

  // Check user role - only admin and staff can access this page
  const hasAccess = user && (user.role === "staff" || user.role === "admin");
  
  // If user doesn't have access, redirect to home page
  if (!hasAccess) {
    toast.error("Access Denied", { 
      description: "You don't have permission to access the inventory",
      duration: 5000
    });
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const lowStockItems = medicines.filter(med => med.quantity <= med.threshold);
    
    if (lowStockItems.length > 0) {
      lowStockItems.forEach(med => {
        toast.warning(
          "Low Stock Alert", 
          { 
            description: `${med.name} is running low (${med.quantity} ${med.unit} remaining)`,
            duration: 5000
          }
        );
      });
    }
  }, [medicines]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMedicine(prev => ({
      ...prev,
      [name]: name === "quantity" || name === "threshold" ? Number(value) : value
    }));
  };

  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.category || !newMedicine.expiryDate) {
      toast.error("Please fill in all required fields including expiration date");
      return;
    }

    addMedicine({
      name: newMedicine.name,
      category: newMedicine.category,
      quantity: newMedicine.quantity,
      threshold: newMedicine.threshold,
      unit: newMedicine.unit,
      expiryDate: newMedicine.expiryDate
    });

    setNewMedicine({
      name: "",
      category: "",
      quantity: 0,
      threshold: 10,
      unit: "tablets",
      expiryDate: ""
    });
    setOpenAddDialog(false);
  };

  const handleUpdateQuantity = (id: string) => {
    if (!updateQuantity[id]) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const medicine = medicines.find(med => med.id === id);
    if (medicine) {
      updateMedicine(id, { 
        quantity: medicine.quantity + Number(updateQuantity[id])
      });
      
      setUpdateQuantity(prev => ({
        ...prev,
        [id]: 0
      }));

      toast.success(`Updated ${medicine.name} inventory`);
    }
  };
  
  const confirmDelete = async () => {
    if (medicineToDelete) {
      try {
        const medicine = medicines.find(med => med.id === medicineToDelete);
        await deleteMedicine(medicineToDelete);
        toast.success(`${medicine?.name || 'Medicine'} has been removed from inventory`);
        setMedicineToDelete(null);
      } catch (error) {
        toast.error("Failed to delete medicine");
        console.error("Error deleting medicine:", error);
      }
    }
  };

  const formatExpiryDate = (expiryDate: string) => {
    if (!expiryDate) return 'N/A';
    return new Date(expiryDate).toLocaleDateString();
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const canManageInventory = user && (user.role === "staff" || user.role === "admin");

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medicine Inventory</h1>
            <p className="text-muted-foreground">Track and manage medication stock levels</p>
          </div>
          
          {canManageInventory && (
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PackagePlus className="h-4 w-4" />
                  Add New Medicine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Medicine</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new medicine to add to inventory.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name *</Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={newMedicine.name}
                      onChange={handleInputChange}
                      className="col-span-3" 
                      placeholder="Medicine name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category *</Label>
                    <Input 
                      id="category" 
                      name="category"
                      value={newMedicine.category}
                      onChange={handleInputChange}
                      className="col-span-3" 
                      placeholder="e.g., Antibiotics, Painkillers"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">Quantity</Label>
                    <Input 
                      id="quantity" 
                      name="quantity"
                      type="number"
                      value={newMedicine.quantity}
                      onChange={handleInputChange}
                      className="col-span-3" 
                      placeholder="Initial quantity"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="threshold" className="text-right">Alert Threshold</Label>
                    <Input 
                      id="threshold" 
                      name="threshold"
                      type="number"
                      value={newMedicine.threshold}
                      onChange={handleInputChange}
                      className="col-span-3" 
                      placeholder="Low stock alert"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">Unit</Label>
                    <Input 
                      id="unit" 
                      name="unit"
                      value={newMedicine.unit}
                      onChange={handleInputChange}
                      className="col-span-3" 
                      placeholder="e.g., tablets, bottles, vials"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expiryDate" className="text-right">Expiry Date *</Label>
                    <Input 
                      id="expiryDate" 
                      name="expiryDate"
                      type="date"
                      value={newMedicine.expiryDate}
                      onChange={handleInputChange}
                      className="col-span-3" 
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                  <Button onClick={handleAddMedicine}>Add to Inventory</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
          
        {/* Low Stock Alerts */}
        {medicines.some(med => med.quantity <= med.threshold) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Low Stock Alert</AlertTitle>
            <AlertDescription>
              Some items are running low on stock. Please review and restock as needed.
            </AlertDescription>
          </Alert>
        )}
          
        {/* Medicine Table */}
        <Card>
          <CardHeader>
            <CardTitle>Medicine Stock Levels</CardTitle>
            <CardDescription>Manage your clinic's medication inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  {canManageInventory && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageInventory ? 7 : 6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-12 w-12 mb-2" />
                        <p>No medicine items found</p>
                        {canManageInventory && (
                          <Button 
                            variant="outline" 
                            className="mt-4 gap-2"
                            onClick={() => setOpenAddDialog(true)}
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add First Item
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  medicines.map(medicine => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.category}</TableCell>
                      <TableCell>{medicine.quantity} {medicine.unit}</TableCell>
                      <TableCell>{medicine.unit}</TableCell>
                      <TableCell>
                        <span className={`${isExpired(medicine.expiryDate) ? 'text-red-600 font-medium' : ''}`}>
                          {formatExpiryDate(medicine.expiryDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isExpired(medicine.expiryDate)
                            ? 'bg-red-100 text-red-800'
                            : medicine.quantity <= medicine.threshold 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {isExpired(medicine.expiryDate) 
                            ? 'Expired' 
                            : medicine.quantity <= medicine.threshold 
                              ? 'Low Stock' 
                              : 'In Stock'}
                        </span>
                      </TableCell>
                      {canManageInventory && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              className="w-20"
                              placeholder="Qty"
                              value={updateQuantity[medicine.id] || ''}
                              onChange={(e) => setUpdateQuantity(prev => ({
                                ...prev,
                                [medicine.id]: Number(e.target.value)
                              }))}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateQuantity(medicine.id)}
                              className="gap-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Update
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setMedicineToDelete(medicine.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!medicineToDelete} onOpenChange={(open) => !open && setMedicineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this medicine
              from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Inventory;
