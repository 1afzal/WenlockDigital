import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { InventoryManagement } from "@/components/dashboard/pharmacy/inventory-management";
import { PrescriptionProcessing } from "@/components/dashboard/pharmacy/prescription-processing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Package, FileText, AlertTriangle, CheckCircle } from "lucide-react";

export default function PharmacyDashboard() {
  const { user } = useAuth();
  
  const { data: drugs = [] } = useQuery({
    queryKey: ["/api/drugs"],
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  const { data: pendingPrescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions/pending"],
  });

  const lowStockDrugs = drugs.filter((drug: any) => 
    drug.quantity <= drug.minStockLevel
  );

  const todayPrescriptions = prescriptions.filter((pres: any) => {
    const today = new Date().toDateString();
    return new Date(pres.createdAt).toDateString() === today;
  });

  const dispensedToday = prescriptions.filter((pres: any) => {
    const today = new Date().toDateString();
    return pres.status === 'dispensed' && 
           pres.dispensedAt && 
           new Date(pres.dispensedAt).toDateString() === today;
  });

  return (
    <div className="flex min-h-screen bg-surface-gray">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}</p>
            </div>
            <Badge variant="outline" className="border-health-green text-health-green">
              On Duty
            </Badge>
          </div>

          {/* Low Stock Alert */}
          {lowStockDrugs.length > 0 && (
            <div className="bg-alert-orange/10 border border-alert-orange/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-alert-orange" />
                <h3 className="font-semibold text-alert-orange">Low Stock Alert</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockDrugs.slice(0, 6).map((drug: any) => (
                  <div key={drug.id} className="bg-white p-3 rounded-lg border border-alert-orange/20">
                    <p className="font-medium text-gray-900">{drug.name}</p>
                    <p className="text-sm text-gray-600">{drug.genericName}</p>
                    <p className="text-sm font-medium text-alert-orange">
                      Stock: {drug.quantity} (Min: {drug.minStockLevel})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Prescriptions</p>
                    <p className="text-2xl font-bold text-alert-orange">{pendingPrescriptions.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-alert-orange" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Dispensed Today</p>
                    <p className="text-2xl font-bold text-health-green">{dispensedToday.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-health-green" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Drugs</p>
                    <p className="text-2xl font-bold text-medical-blue">{drugs.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-medical-blue" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-emergency-red">{lowStockDrugs.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-emergency-red" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prescription Processing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Prescription Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PrescriptionProcessing />
                </CardContent>
              </Card>

              {/* Drug Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Drug Inventory Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InventoryManagement />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Today's Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Prescriptions Received</span>
                      <span className="font-semibold">{todayPrescriptions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Prescriptions Dispensed</span>
                      <span className="font-semibold">{dispensedToday.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending Processing</span>
                      <span className="font-semibold text-alert-orange">{pendingPrescriptions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Low Stock Alerts</span>
                      <span className="font-semibold text-emergency-red">{lowStockDrugs.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Prescriptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Prescriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayPrescriptions.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No prescriptions today</p>
                    ) : (
                      todayPrescriptions.slice(0, 5).map((prescription: any) => (
                        <div key={prescription.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{prescription.patient?.user?.fullName}</p>
                            <p className="text-xs text-gray-600">Dr. {prescription.doctor?.user?.fullName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(prescription.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={
                              prescription.status === 'dispensed' 
                                ? 'bg-health-green text-white' 
                                : 'bg-alert-orange text-white'
                            }
                          >
                            {prescription.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Items</span>
                      <span className="font-semibold">{drugs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">In Stock</span>
                      <span className="font-semibold text-health-green">
                        {drugs.filter((drug: any) => drug.quantity > drug.minStockLevel).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Low Stock</span>
                      <span className="font-semibold text-alert-orange">
                        {drugs.filter((drug: any) => drug.quantity <= drug.minStockLevel && drug.quantity > 0).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Out of Stock</span>
                      <span className="font-semibold text-emergency-red">
                        {drugs.filter((drug: any) => drug.quantity === 0).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
