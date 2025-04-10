
import React from 'react';
import { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, MoreVertical, Loader2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface CustomersListProps {
  customers: Customer[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (customer: Customer) => void;
  onSelect: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export const CustomersList = ({ 
  customers, 
  isLoading, 
  onAddNew, 
  onEdit, 
  onSelect,
  onDelete 
}: CustomersListProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Customer List</h2>
        <Button onClick={onAddNew}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Customer
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center my-12">
          <p className="text-muted-foreground mb-4">No customers found</p>
          <Button onClick={onAddNew} variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add your first customer
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} 
                  className="cursor-pointer hover:bg-secondary/20"
                  onClick={() => onSelect(customer)}
                >
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{customer.email || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{customer.company || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="capitalize">
                      {customer.status || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(customer.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelect(customer)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(customer)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(customer.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
