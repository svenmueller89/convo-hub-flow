
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mailbox, MailboxFormData } from '@/types/mailbox';
import { useAuth } from '@/contexts/AuthContext';

export const useMailboxes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const addMailbox = useMutation({
    mutationFn: async (formData: MailboxFormData) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if this is the first mailbox, make it primary if so
      let isPrimary = formData.is_primary;
      if (!mailboxes || mailboxes.length === 0) {
        isPrimary = true;
      }
      
      const mailboxData = {
        ...formData,
        is_primary: isPrimary,
        user_id: user.id
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
      
      // Use type assertion to work with the mailboxes table
      const { data, error } = await supabase
        .from('mailboxes')
        .update(formData as any)
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

  const hasPrimaryMailbox = () => {
    return mailboxes?.some(mailbox => mailbox.is_primary) || false;
  };
  
  const hasMailboxes = () => {
    return (mailboxes && mailboxes.length > 0) || false;
  };

  return {
    mailboxes,
    isLoading,
    error,
    addMailbox,
    updateMailbox,
    deleteMailbox,
    setPrimaryMailbox,
    hasPrimaryMailbox,
    hasMailboxes
  };
};
