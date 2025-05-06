
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationStatus, ConversationStatusFormData } from '@/types/conversation-status';

export function useConversationStatuses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all statuses for the current user
  const { data: statuses, isLoading, error } = useQuery({
    queryKey: ['conversation-statuses'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('conversation_statuses')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      
      return data as ConversationStatus[];
    },
    enabled: !!user,
  });

  // Add new status
  const addStatus = useMutation({
    mutationFn: async (formData: ConversationStatusFormData) => {
      if (!user) throw new Error('User not authenticated');

      // Get the highest display order to append new status at the end
      const { data: highestOrder } = await supabase
        .from('conversation_statuses')
        .select('display_order')
        .eq('user_id', user.id)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const displayOrder = highestOrder ? highestOrder.display_order + 1 : 1;
      
      const statusData = {
        ...formData,
        user_id: user.id,
        display_order: displayOrder,
      };
      
      const { data, error } = await supabase
        .from('conversation_statuses')
        .insert([statusData])
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as ConversationStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-statuses'] });
      toast({
        title: "Status added",
        description: "Your conversation status has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update existing status
  const updateStatus = useMutation({
    mutationFn: async ({ 
      id, 
      formData 
    }: { 
      id: string; 
      formData: ConversationStatusFormData;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('conversation_statuses')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as ConversationStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-statuses'] });
      toast({
        title: "Status updated",
        description: "Your conversation status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete status
  const deleteStatus = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get the default status to reassign conversations if needed
      const { data: defaultStatus } = await supabase
        .from('conversation_statuses')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();
        
      const { error } = await supabase
        .from('conversation_statuses')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }

      return defaultStatus?.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-statuses'] });
      toast({
        title: "Status removed",
        description: "The conversation status has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update display order of statuses
  const updateStatusOrder = useMutation({
    mutationFn: async (orderedStatuses: ConversationStatus[]) => {
      if (!user) throw new Error('User not authenticated');
      
      // Update each status with new display_order
      const updates = orderedStatuses.map((status, index) => {
        return supabase
          .from('conversation_statuses')
          .update({ display_order: index + 1 })
          .eq('id', status.id);
      });
      
      await Promise.all(updates);
      return orderedStatuses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-statuses'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    statuses,
    isLoading,
    error,
    addStatus,
    updateStatus,
    deleteStatus,
    updateStatusOrder,
  };
}
