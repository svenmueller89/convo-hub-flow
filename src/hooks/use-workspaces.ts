
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, CreateWorkspaceParams } from '@/types/workspace';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useWorkspaces = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current authenticated user

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async (): Promise<Workspace[]> => {
      // We need to use 'from' with any type assertion since the generated types don't include
      // the workspaces table yet (will be updated after a Supabase types reload)
      const { data, error } = await (supabase as any)
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const createWorkspace = useMutation({
    mutationFn: async (params: CreateWorkspaceParams): Promise<Workspace> => {
      if (!user) throw new Error("You must be logged in to create a workspace");
      
      const { name, description } = params;
      
      // Insert new workspace using any type assertion and explicitly set user_id
      const { data, error } = await (supabase as any)
        .from('workspaces')
        .insert([{ 
          name, 
          description, 
          user_id: user.id // Explicitly set the user_id to the current user's ID
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: "Workspace created",
        description: "Your workspace has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating workspace",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getWorkspace = async (id: string): Promise<Workspace | null> => {
    // Use any type assertion here too
    const { data, error } = await (supabase as any)
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching workspace:", error);
      return null;
    }
    
    return data;
  };

  const hasWorkspaces = (): boolean => {
    return !!workspaces && workspaces.length > 0;
  };

  return {
    workspaces,
    isLoading,
    createWorkspace,
    getWorkspace,
    hasWorkspaces
  };
};
