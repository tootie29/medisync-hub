
import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertCircle, 
  Package, 
  PackagePlus, 
  PlusCircle, 
  RefreshCw 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Inventory = () => {
  const { medicines, addMedicine, updateMedicine } = useData();
  const { user } = useAuth();
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    category: "",
    quantity: 0,
    threshold: 10,
    unit: "tablets"
  });
  const [updateQuantity, setUpdateQuantity] = useState<{ [key: string]: number }>({});
  const [openAddDialog, setOpenAddDialog] = useState(false);

  // Check for low stock items on component mount
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
    if (!newMedicine.name || !newMedicine.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    addMedicine({
      name: newMedicine.name,
      category: newMedicine.category,
      quantity: newMedicine.quantity,
      threshold: newMedicine.threshold,
      unit: newMedicine.unit
    });

    // Reset form
    setNewMedicine({
      name: "",
      category: "",
      quantity: 0,
      threshold: 10,
      unit: "tablets"
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
      
      // Reset update quantity for this medicine
      setUpdateQuantity(prev => ({
        ...prev,
        [id]: 0
      }));

      toast.success(`Updated ${medicine.name} inventory`);
    }
  };

  // Only allow admin and doctors to manage inventory
  const canManageInventory = user && (user.role === "admin" || user.role === "doctor");

  return (
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
                  <label htmlFor="name" className="text-right">Name</label>
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
                  <label htmlFor="category" className="text-right">Category</label>
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
                  <label htmlFor="quantity" className="text-right">Quantity</label>
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
                  <label htmlFor="threshold" className="text-right">Alert Threshold</label>
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
                  <label htmlFor="unit" className="text-right">Unit</label>
                  <Input 
                    id="unit" 
                    name="unit"
                    value={newMedicine.unit}
                    onChange={handleInputChange}
                    className="col-span-3" 
                    placeholder="e.g., tablets, bottles, vials"
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

      {medicines.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-center">No Medicines in Inventory</CardTitle>
            <CardDescription className="text-center">
              Start by adding medicines to the inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Package className="h-16 w-16 text-muted-foreground opacity-20" />
          </CardContent>
          {canManageInventory && (
            <CardFooter className="flex justify-center pb-8">
              <Button onClick={() => setOpenAddDialog(true)} variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add First Medicine
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <>
          {/* Low stock alert */}
          {medicines.some(med => med.quantity <= med.threshold) && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low Stock Alert</AlertTitle>
              <AlertDescription>
                Some medicines are running low and need to be restocked soon.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  {canManageInventory && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>{medicine.category}</TableCell>
                    <TableCell>
                      {medicine.quantity} {medicine.unit}
                    </TableCell>
                    <TableCell>
                      {medicine.quantity <= medicine.threshold ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                    {canManageInventory && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-20"
                            placeholder="Qty"
                            value={updateQuantity[medicine.id] || ""}
                            onChange={(e) => 
                              setUpdateQuantity(prev => ({
                                ...prev, 
                                [medicine.id]: Number(e.target.value)
                              }))
                            }
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateQuantity(medicine.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
