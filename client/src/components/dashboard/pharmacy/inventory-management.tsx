import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Package, Search, Plus, Edit, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export function InventoryManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: drugs = [] } = useQuery({
    queryKey: ["/api/drugs"],
  });

  const updateDrugMutation = useMutation({
    mutationFn: async ({ drugId, quantity }: { drugId: number; quantity: number }) => {
      const res = await apiRequest("PATCH", `/api/drugs/${drugId}`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drugs"] });
      toast({
        title: "Stock updated",
        description: "Drug quantity has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and search drugs
  const filteredDrugs = drugs.filter((drug: any) => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.genericName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === "low-stock") {
      return matchesSearch && drug.quantity <= drug.minStockLevel;
    }
    if (selectedCategory === "out-of-stock") {
      return matchesSearch && drug.quantity === 0;
    }
    return matchesSearch;
  });

  const getStockStatus = (drug: any) => {
    if (drug.quantity === 0) return { status: "Out of Stock", color: "bg-emergency-red" };
    if (drug.quantity <= drug.minStockLevel) return { status: "Low Stock", color: "bg-alert-orange" };
    return { status: "In Stock", color: "bg-health-green" };
  };

  const handleQuickStock = (drugId: number, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    updateDrugMutation.mutate({ drugId, quantity: newQuantity });
  };

  const lowStockCount = drugs.filter((drug: any) => drug.quantity <= drug.minStockLevel && drug.quantity > 0).length;
  const outOfStockCount = drugs.filter((drug: any) => drug.quantity === 0).length;
  const totalValue = drugs.reduce((sum: number, drug: any) => sum + (drug.quantity * (drug.unitPrice || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
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
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-alert-orange">{lowStockCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-alert-orange" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-emergency-red">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-emergency-red" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-health-green">₹{(totalValue / 100).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-health-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by drug name or generic name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-medical-blue" : ""}
          >
            All Items
          </Button>
          <Button
            variant={selectedCategory === "low-stock" ? "default" : "outline"}
            onClick={() => setSelectedCategory("low-stock")}
            className={selectedCategory === "low-stock" ? "bg-alert-orange" : ""}
          >
            Low Stock
          </Button>
          <Button
            variant={selectedCategory === "out-of-stock" ? "default" : "outline"}
            onClick={() => setSelectedCategory("out-of-stock")}
            className={selectedCategory === "out-of-stock" ? "bg-emergency-red" : ""}
          >
            Out of Stock
          </Button>
        </div>
        <Button className="bg-health-green hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Drug
        </Button>
      </div>

      {/* Inventory Table */}
      <div className="space-y-3">
        {filteredDrugs.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "No drugs found matching your search" : "No drugs in inventory"}
            </p>
          </div>
        ) : (
          filteredDrugs.map((drug: any) => {
            const stockStatus = getStockStatus(drug);
            return (
              <Card key={drug.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-medical-blue rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{drug.name}</h4>
                        {drug.genericName && (
                          <p className="text-sm text-gray-600">Generic: {drug.genericName}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${stockStatus.color} text-white text-xs`}>
                            {stockStatus.status}
                          </Badge>
                          {drug.manufacturer && (
                            <span className="text-xs text-gray-500">{drug.manufacturer}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Stock:</span>
                          <span className={`font-bold ${
                            drug.quantity === 0 ? 'text-emergency-red' :
                            drug.quantity <= drug.minStockLevel ? 'text-alert-orange' :
                            'text-health-green'
                          }`}>
                            {drug.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Min: {drug.minStockLevel}</p>
                        {drug.unitPrice && (
                          <p className="text-xs text-gray-500">₹{(drug.unitPrice / 100).toFixed(2)} each</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStock(drug.id, drug.quantity, -10)}
                          disabled={drug.quantity === 0 || updateDrugMutation.isPending}
                        >
                          -10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStock(drug.id, drug.quantity, -1)}
                          disabled={drug.quantity === 0 || updateDrugMutation.isPending}
                        >
                          -1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStock(drug.id, drug.quantity, 1)}
                          disabled={updateDrugMutation.isPending}
                        >
                          +1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStock(drug.id, drug.quantity, 10)}
                          disabled={updateDrugMutation.isPending}
                        >
                          +10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateDrugMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {drug.expiryDate && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Batch: {drug.batchNumber || 'N/A'}</span>
                        <span className={`${
                          new Date(drug.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-emergency-red' : 'text-gray-600'
                        }`}>
                          Expires: {new Date(drug.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <Button variant="outline" className="flex-1">
          <Package className="h-4 w-4 mr-2" />
          Generate Stock Report
        </Button>
        <Button variant="outline" className="flex-1">
          <AlertTriangle className="h-4 w-4 mr-2" />
          View Expiry Alerts
        </Button>
        <Button variant="outline" className="flex-1">
          <TrendingUp className="h-4 w-4 mr-2" />
          Purchase Orders
        </Button>
      </div>
    </div>
  );
}
