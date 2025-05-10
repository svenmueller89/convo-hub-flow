
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceSetup } from '@/components/onboarding/WorkspaceSetup';
import { MailboxSetup } from '@/components/onboarding/MailboxSetup';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { Mail } from 'lucide-react';

const SetupPage: React.FC = () => {
  const { user } = useAuth();
  const { isLoading: isLoadingMailboxes, hasPrimaryMailbox } = useMailboxes();
  const { workspaces, isLoading: isLoadingWorkspaces, hasWorkspaces } = useWorkspaces();
  const [setupStep, setSetupStep] = useState<'workspace' | 'mailbox'>('workspace');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine which setup step to show based on if user has workspaces
  useEffect(() => {
    if (!isLoadingWorkspaces) {
      if (hasWorkspaces()) {
        setSetupStep('mailbox');
      } else {
        setSetupStep('workspace');
      }
    }
  }, [isLoadingWorkspaces, hasWorkspaces]);

  const handleWorkspaceComplete = () => {
    setSetupStep('mailbox');
  };

  const handleWorkspaceSkip = () => {
    setSetupStep('mailbox');
  };

  const handleMailboxSkip = () => {
    toast({
      title: "Setup skipped",
      description: "You can add mailboxes later in settings."
    });
    navigate('/');
  };

  const handleMailboxComplete = () => {
    if (!hasPrimaryMailbox()) {
      toast({
        title: "Setup incomplete",
        description: "Please add at least one mailbox before continuing.",
        variant: "destructive"
      });
      return;
    }
    
    // If user has workspaces, navigate to the first workspace dashboard
    if (workspaces && workspaces.length > 0) {
      navigate(`/workspaces/${workspaces[0].id}/dashboard`);
      toast({
        title: "Setup completed",
        description: "Your workspace and mailboxes have been configured successfully."
      });
    } else {
      navigate('/');
      toast({
        title: "Setup completed",
        description: "Your mailboxes have been configured successfully."
      });
    }
  };

  if (isLoadingMailboxes || isLoadingWorkspaces) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-convo-primary" />
            <span className="ml-2 text-2xl font-bold text-gray-800">ConvoHub</span>
          </div>
          <h2 className="text-lg font-medium text-gray-600">
            {setupStep === 'workspace' 
              ? "Set up your workspace" 
              : "Set up your mailboxes"}
          </h2>
        </div>
        
        {setupStep === 'workspace' ? (
          <WorkspaceSetup
            onComplete={handleWorkspaceComplete}
            onSkip={handleWorkspaceSkip}
          />
        ) : (
          <MailboxSetup
            onComplete={handleMailboxComplete}
            onSkip={handleMailboxSkip}
          />
        )}
      </div>
    </div>
  );
};

export default SetupPage;
