
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomerInteraction, CustomerInteractionFormData } from '@/types/customer-interaction';
import { useAuth } from '@/contexts/AuthContext';

export const useCustomerInteractions = (customerId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: interactions, isLoading, error } = useQuery({
    queryKey: ['customerInteractions', customerId],
    queryFn: async () => {
      if (!user || !customerId) return [];
      
      // Using a raw SQL query approach to avoid type errors
      const { data, error } = await supabase
        .from('customer_interactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as unknown as CustomerInteraction[];
    },
    enabled: !!user && !!customerId,
  });

  const addInteraction = useMutation({
    mutationFn: async (formData: CustomerInteractionFormData) => {
      if (!user || !customerId) throw new Error('Missing required data');
      
      const interactionData = {
        ...formData,
        customer_id: customerId,
        user_id: user.id
      };
      
      // Using a raw SQL query approach to avoid type errors
      const { data, error } = await supabase
        .from('customer_interactions')
        .insert([interactionData])
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as unknown as CustomerInteraction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerInteractions', customerId] });
      toast({
        title: "Interaction added",
        description: "The customer interaction has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add interaction",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteInteraction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Using a raw SQL query approach to avoid type errors
      const { error } = await supabase
        .from('customer_interactions')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerInteractions', customerId] });
      toast({
        title: "Interaction deleted",
        description: "The customer interaction has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete interaction",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    interactions,
    isLoading,
    error,
    addInteraction,
    deleteInteraction
  };
};
