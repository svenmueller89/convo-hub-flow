
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mailbox } from '@/types/mailbox';
import { UseMailboxesQuery } from './types';

/**
 * Hook for querying mailboxes from the database
 */
export const useMailboxQuery = (): UseMailboxesQuery => {
  const { user } = useAuth();
  
  const { data: mailboxes, isLoading, error } = useQuery({
    queryKey: ['mailboxes'],
    queryFn: async () => {
      if (!user) return [];
      
      // Use type assertion to work with the mailboxes table
      const { data, error } = await supabase
        .from('mailboxes')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as unknown as Mailbox[];
    },
    enabled: !!user,
  });

  // Extract the primary mailbox from the list
  const primaryMailbox = mailboxes?.find(mailbox => mailbox.is_primary);

  const hasPrimaryMailbox = () => {
    return mailboxes?.some(mailbox => mailbox.is_primary) || false;
  };
  
  const hasMailboxes = () => {
    return (mailboxes && mailboxes.length > 0) || false;
  };

  return {
    mailboxes,
    primaryMailbox,
    isLoading,
    error: error as Error | null,
    hasPrimaryMailbox,
    hasMailboxes
  };
};
