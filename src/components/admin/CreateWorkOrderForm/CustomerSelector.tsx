"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Loader2 } from "lucide-react";
import { getBranchHeader } from "@/lib/utils/branch";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  onClear: () => void;
  currentBranchId: string | null;
}

export default function CustomerSelector({
  selectedCustomer,
  onSelect,
  onClear,
  currentBranchId,
}: CustomerSelectorProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Search customers with debounce
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 2) {
        setCustomerResults([]);
        return;
      }

      setSearchingCustomers(true);
      try {
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId),
        };
        const response = await fetch(
          `/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`,
          { headers },
        );
        if (response.ok) {
          const data = await response.json();
          setCustomerResults(data.customers || []);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
      } finally {
        setSearchingCustomers(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch, currentBranchId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedCustomer ? (
          <div
            className="flex items-center justify-between p-4 border rounded-lg bg-admin-bg-secondary"
            style={{ backgroundColor: "var(--admin-border-primary)" }}
          >
            <div>
              <div className="font-medium">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </div>
              <div className="text-sm text-tierra-media">
                {selectedCustomer.email}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Cambiar
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tierra-media" />
            <Input
              placeholder="Buscar cliente por nombre o email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-10"
            />
            {customerSearch.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchingCustomers ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : customerResults.length > 0 ? (
                  customerResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                      onClick={() => {
                        onSelect(customer);
                        setCustomerSearch("");
                        setCustomerResults([]);
                      }}
                    >
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-tierra-media">
                        {customer.email}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-tierra-media">
                    No se encontraron clientes
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
