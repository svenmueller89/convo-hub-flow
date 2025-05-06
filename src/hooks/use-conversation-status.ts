
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateStatusParams {
  conversationId: string;
  statusId: string;
}

export const useConversationStatus = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateConversationStatus = useMutation({
    mutationFn: async ({ conversationId, statusId }: UpdateStatusParams) => {
      setIsUpdating(true);
      
      try {
        console.log(`Updating status for conversation ID: ${conversationId} to status ID: ${statusId}`);
        const { data, error } = await supabase.functions.invoke('update-conversation-status', {
          body: { conversationId, statusId }
        });
        
        if (error) throw error;
        
        return data;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      // Force a refresh of both email queries and conversation queries
      // without causing recursion issues
      queryClient.invalidateQueries({ 
        queryKey: ['emails'],
        refetchType: 'all'
      });
      
      // Invalidate all conversation queries to make sure details are refreshed
      queryClient.invalidateQueries({
        queryKey: ['conversation'],
        refetchType: 'all'
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  return {
    updateConversationStatus,
    isUpdating
  };
};
