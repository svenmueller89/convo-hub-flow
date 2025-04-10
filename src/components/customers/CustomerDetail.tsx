
import React from 'react';
import { Customer } from '@/types/customer';
import { CustomerInteractions } from '@/components/customers/CustomerInteractions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Building, CalendarClock, User } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface CustomerDetailProps {
  customer: Customer;
  onEdit: () => void;
}

export const CustomerDetail = ({ customer, onEdit }: CustomerDetailProps) => {
  return (
    <Tabs defaultValue="details">
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="details">Customer Details</TabsTrigger>
        <TabsTrigger value="interactions">Interactions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <Badge>{customer.status}</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              
              {customer.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.company}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span>Created: {format(new Date(customer.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            {customer.notes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm whitespace-pre-wrap p-3 bg-muted rounded-md">{customer.notes}</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <div className="flex justify-end w-full">
              <button 
                className="text-sm text-primary hover:underline"
                onClick={onEdit}
              >
                Edit Customer
              </button>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="interactions">
        <CustomerInteractions customer={customer} />
      </TabsContent>
    </Tabs>
  );
};
