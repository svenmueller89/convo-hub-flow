
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailsResponse } from '@/types/email';

export function useEmailsQuery(primaryMailbox: any, hasPrimaryMailbox: () => boolean, mailboxesLoading: boolean) {
  // Fetch emails using edge function
  const { 
    data: emailsData, 
    isLoading: emailsLoading, 
    error: emailsError, 
    refetch: refetchEmails
  } = useQuery({
    queryKey: ['emails', primaryMailbox?.id],
    queryFn: async () => {
      // Check if we have a primary mailbox
      if (!hasPrimaryMailbox()) {
        console.log('No primary mailbox found, returning empty emails array');
        return {
          emails: [],
          totalCount: 0,
          unreadCount: 0
        };
      }
      
      try {
        console.log('Fetching emails for mailbox:', primaryMailbox?.id);
        // Call the edge function to fetch emails
        const { data, error } = await supabase.functions.invoke('fetch-emails', {
          body: {
            mailboxId: primaryMailbox?.id,
            page: 1,
            limit: 20
          }
        });
        
        if (error) {
          console.error('Error from fetch-emails function:', error);
          throw error;
        }
        
        console.log('Emails fetched successfully:', data);
        return data as EmailsResponse;
      } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
      }
    },
    enabled: !mailboxesLoading && hasPrimaryMailbox(),
    staleTime: 0, // Disable staleTime to ensure we always get fresh data
  });
  
  return {
    emailsData,
    emailsLoading,
    emailsError,
    refetchEmails
  };
}
