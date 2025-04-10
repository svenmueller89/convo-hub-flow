
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer, CustomerFormData } from '@/types/customer';
import { useAuth } from '@/contexts/AuthContext';

export const useCustomers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      return data as Customer[];
    },
    enabled: !!user,
  });

  const createCustomer = useMutation({
    mutationFn: async (formData: CustomerFormData) => {
      if (!user) throw new Error('User not authenticated');
      
      const customerData = {
        ...formData,
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Customer created",
        description: "The customer has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create customer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...formData }: Customer) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('customers')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Customer updated",
        description: "The customer has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update customer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete customer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    customers,
    isLoading,
    error,
    selectedCustomer,
    setSelectedCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};
