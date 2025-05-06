
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
        // In a real app, we would update the status in a database
        // Here we're using the conversation_id to match with emails
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
      // Safely invalidate queries without causing recursion
      // Be specific about the queries we invalidate
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      // For conversation queries, be more specific with the exact query key
      queryClient.invalidateQueries({ 
        queryKey: ['conversation'],
        // Don't use predicate functions here as they can cause recursion
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
