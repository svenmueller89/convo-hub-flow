
import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CustomersList } from '@/components/customers/CustomersList';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { useCustomers } from '@/hooks/use-customers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/types/customer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CustomersPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  
  const { 
    customers,
    isLoading,
    error,
    selectedCustomer,
    setSelectedCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer
  } = useCustomers();

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
    setShowDetail(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowDetail(false);
    setIsDialogOpen(true);
  };

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetail(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    if (!showDetail) {
      setSelectedCustomer(null);
    }
  };

  const handleFormSubmit = (formData: any) => {
    if (isEditing && selectedCustomer) {
      updateCustomer.mutate({ ...formData, id: selectedCustomer.id });
    } else {
      createCustomer.mutate(formData);
    }
    setIsDialogOpen(false);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedCustomer(null);
  };

  if (error) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <p className="text-destructive">Error loading customers: {error.message}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto">
        {showDetail && selectedCustomer ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <button 
                onClick={handleCloseDetail}
                className="text-sm hover:underline flex items-center gap-1"
              >
                ← Back to customers
              </button>
            </div>
            <CustomerDetail 
              customer={selectedCustomer} 
              onEdit={() => setIsDialogOpen(true)} 
            />
          </div>
        ) : (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <CustomersList
                customers={customers || []}
                isLoading={isLoading}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
                onSelect={handleSelect}
                onDelete={(id) => deleteCustomer.mutate(id)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            initialData={selectedCustomer || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleDialogClose}
            isSubmitting={createCustomer.isPending || updateCustomer.isPending}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default CustomersPage;
