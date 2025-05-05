
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SetEmailStatusParams } from './types';

export function useEmailActions(primaryMailbox: any, emailsData: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set status for an email
  const setEmailStatus = useMutation({
    mutationFn: async ({ emailId, status }: SetEmailStatusParams) => {
      console.log(`Setting email ${emailId} status to ${status}`);
      
      try {
        // Call the edge function to update email status
        const { data, error } = await supabase.functions.invoke('update-email-status', {
          body: { emailId, status }
        });
        
        if (error) {
          console.error('Error updating email status:', error);
          throw error;
        }
        
        console.log('Update email status response:', data);
        return data;
      } catch (error) {
        console.error('Error updating email status:', error);
        throw error;
      }
    },
    onMutate: async ({ emailId, status }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['emails', primaryMailbox?.id] });
      
      // Get the current emails data
      const previousData = queryClient.getQueryData(['emails', primaryMailbox?.id]);
      
      // Optimistically update the cache
      if (emailsData && emailsData.emails) {
        const optimisticData = {
          ...emailsData,
          emails: emailsData.emails.map(email => {
            if (email.id === emailId) {
              return { ...email, status };
            }
            return email;
          })
        };
        
        // Update the cache with our optimistic data
        queryClient.setQueryData(['emails', primaryMailbox?.id], optimisticData);
      }
      
      // Return the previous data for rollback in case of error
      return { previousData };
    },
    onSuccess: async (result) => {
      console.log('Set email status mutation successful:', result);
      
      toast({
        title: "Email status updated",
        description: "The email status has been updated successfully.",
      });
    },
    onError: (error, variables, context) => {
      console.error('Error in set email status mutation:', error);
      
      // Roll back to the previous data if available
      if (context?.previousData) {
        queryClient.setQueryData(['emails', primaryMailbox?.id], context.previousData);
      }
      
      toast({
        title: "Failed to update email status",
        description: "There was an error updating the email status.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate the emails query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['emails', primaryMailbox?.id] });
    }
  });
  
  // Mark email as irrelevant
  const markAsIrrelevant = useMutation({
    mutationFn: async (emailId: string) => {
      console.log('Marking email as irrelevant:', emailId);
      
      try {
        // Call the edge function to update email status to 'irrelevant'
        const { data, error } = await supabase.functions.invoke('update-email-status', {
          body: { emailId, status: 'resolved', label: 'irrelevant' }
        });
        
        if (error) {
          console.error('Error marking email as irrelevant:', error);
          throw error;
        }
        
        console.log('Mark as irrelevant response:', data);
        return data;
      } catch (error) {
        console.error('Error marking email as irrelevant:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Email marked as irrelevant",
        description: "The email has been marked as irrelevant and moved out of your inbox."
      });
      
      // Refetch emails to update the view
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });
  
  // Mark email as spam
  const markAsSpam = useMutation({
    mutationFn: async (emailId: string) => {
      console.log('Marking email as spam:', emailId);
      
      try {
        // Call the edge function to update email status to 'spam'
        const { data, error } = await supabase.functions.invoke('update-email-status', {
          body: { emailId, status: 'resolved', label: 'spam' }
        });
        
        if (error) {
          console.error('Error marking email as spam:', error);
          throw error;
        }
        
        console.log('Mark as spam response:', data);
        return data;
      } catch (error) {
        console.error('Error marking email as spam:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Email marked as spam",
        description: "The email has been marked as spam and moved out of your inbox."
      });
      
      // Refetch emails to update the view
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });
  
  return {
    setEmailStatus,
    markAsIrrelevant,
    markAsSpam
  };
}
