
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { Email, EmailSummary, FetchEmailsParams } from '@/types/email';
import { supabase } from '@/integrations/supabase/client';

export const useEmails = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mailboxes, isLoading: mailboxesLoading, hasPrimaryMailbox } = useMailboxes();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  
  // Get the primary mailbox if available
  const primaryMailbox = mailboxes?.find(mailbox => mailbox.is_primary);
  
  // Fetch emails using edge function
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['emails', primaryMailbox?.id],
    queryFn: async () => {
      // Check if we have a primary mailbox
      if (!hasPrimaryMailbox()) {
        return {
          emails: [],
          totalCount: 0,
          unreadCount: 0
        };
      }
      
      try {
        // Call the edge function to fetch emails
        const { data, error } = await supabase.functions.invoke('fetch-emails', {
          body: {
            mailboxId: primaryMailbox?.id,
            page: 1,
            limit: 20
          }
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
      }
    },
    enabled: !mailboxesLoading && hasPrimaryMailbox(),
  });
  
  const emails = data?.emails || [];
  const unreadCount = data?.unreadCount || 0;

  // Get a single email by ID
  const getEmailById = (emailId: string): EmailSummary | undefined => {
    return emails?.find(email => email.id === emailId);
  };

  // Mark email as read
  const markAsRead = useMutation({
    mutationFn: async (emailId: string) => {
      // In a real implementation, we would call an API to mark the email as read
      console.log('Marking email as read:', emailId);
      
      // For now, just return success
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate the emails query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      
      toast({
        title: "Email marked as read",
        description: "The email has been marked as read.",
      });
    },
    onError: (error) => {
      console.error('Error marking email as read:', error);
      toast({
        title: "Failed to mark email as read",
        description: "There was an error marking the email as read.",
        variant: "destructive",
      });
    }
  });

  return {
    emails,
    isLoading,
    error,
    refetch,
    selectedEmail,
    setSelectedEmail,
    getEmailById,
    markAsRead,
    unreadCount,
  };
};
