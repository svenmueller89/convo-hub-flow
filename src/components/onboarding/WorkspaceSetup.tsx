
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const WorkspaceSetup: React.FC<WorkspaceSetupProps> = ({ onComplete, onSkip }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [descError, setDescError] = useState('');
  const { createWorkspace } = useWorkspaces();
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current authenticated user

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Workspace name is required');
      isValid = false;
    } else if (name.trim().length > 50) {
      setNameError('Workspace name cannot exceed 50 characters');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate description
    if (description.length > 200) {
      setDescError('Description cannot exceed 200 characters');
      isValid = false;
    } else {
      setDescError('');
    }
    
    return isValid;
  };

  const handleCreateWorkspace = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a workspace.",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      await createWorkspace.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined
      });
      onComplete();
    } catch (error) {
      console.error("Error in create workspace:", error);
      // Error handling is in the mutation definition
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to ConvoHub! Let's set up your first workspace.</CardTitle>
        <CardDescription>
          Give your team a home for shared inboxes and customer data.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {createWorkspace.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Could not create workspace: {createWorkspace.error.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="name">Workspace Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="e.g. Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={nameError ? "border-red-500" : ""}
          />
          {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Brief description of your team or company"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={descError ? "border-red-500" : ""}
            rows={3}
          />
          {descError && <p className="text-red-500 text-sm">{descError}</p>}
          <p className="text-xs text-gray-500">{description.length}/200 characters</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onSkip}>Skip for now</Button>
        <Button 
          onClick={handleCreateWorkspace} 
          disabled={!name.trim() || createWorkspace.isPending}
          className="min-w-[120px]"
        >
          {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
        </Button>
      </CardFooter>
    </Card>
  );
};
