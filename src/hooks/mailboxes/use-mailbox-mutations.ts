
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Mailbox, MailboxFormData } from '@/types/mailbox';
import { UseMailboxMutations } from './types';

/**
 * Hook for mailbox CRUD operations
 */
export const useMailboxMutations = (): UseMailboxMutations => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const addMailbox = useMutation({
    mutationFn: async (formData: MailboxFormData) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get existing mailboxes to check if this is the first one
      const { data: existingMailboxes } = await supabase
        .from('mailboxes')
        .select('id');
      
      // Check if this is the first mailbox, make it primary if so
      let isPrimary = formData.is_primary;
      if (!existingMailboxes || existingMailboxes.length === 0) {
        isPrimary = true;
      }
      
      const mailboxData = {
        ...formData,
        is_primary: isPrimary,
        user_id: user.id,
        connection_status: 'connected', // In a real implementation, this would be set after testing
        last_sync: new Date().toISOString()
      };
      
      // Use type assertion to work with the mailboxes table
      const { data, error } = await supabase
        .from('mailboxes')
        .insert([mailboxData as any])
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as unknown as Mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
      toast({
        title: "Mailbox added",
        description: "Your mailbox has been connected successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add mailbox",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMailbox = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: Partial<MailboxFormData> }) => {
      if (!user) throw new Error('User not authenticated');
      
      // If password is empty, remove it from the update
      if (formData.password === '') {
        delete formData.password;
      }
      
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
        connection_status: 'connected', // In a real implementation, this would be set after testing
        last_sync: new Date().toISOString()
      };
      
      // Use type assertion to work with the mailboxes table
      const { data, error } = await supabase
        .from('mailboxes')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as unknown as Mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
      toast({
        title: "Mailbox updated",
        description: "Your mailbox has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update mailbox",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMailbox = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Use type assertion to work with the mailboxes table
      const { error } = await supabase
        .from('mailboxes')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
      toast({
        title: "Mailbox removed",
        description: "The mailbox has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove mailbox",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const setPrimaryMailbox = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // First, set all mailboxes to non-primary
      const { error: updateError } = await supabase
        .from('mailboxes')
        .update({ is_primary: false } as any)
        .eq('user_id', user.id);
        
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Then set the selected mailbox as primary
      const { data, error } = await supabase
        .from('mailboxes')
        .update({ is_primary: true } as any)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data as unknown as Mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] });
      toast({
        title: "Primary mailbox updated",
        description: "Your primary mailbox has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update primary mailbox",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    addMailbox,
    updateMailbox,
    deleteMailbox,
    setPrimaryMailbox
  };
};
