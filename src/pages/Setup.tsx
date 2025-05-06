
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail, Plus, Star, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { WorkspaceSetup } from '@/components/onboarding/WorkspaceSetup';
import { useWorkspaces } from '@/hooks/use-workspaces';

const SetupPage: React.FC = () => {
  const { user } = useAuth();
  const { mailboxes, isLoading: isLoadingMailboxes, addMailbox, deleteMailbox, setPrimaryMailbox, hasPrimaryMailbox } = useMailboxes();
  const { workspaces, isLoading: isLoadingWorkspaces, hasWorkspaces } = useWorkspaces();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Autofill user's email initially
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setDisplayName(user.email.split('@')[0] || '');
    }
  }, [user]);

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addMailbox.mutateAsync({
        email,
        display_name: displayName || null,
        is_primary: !hasPrimaryMailbox()
      });
      
      // Reset form
      setEmail('');
      setDisplayName('');
    } catch (error) {
      console.error("Failed to add mailbox:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkspaceComplete = () => {
    setSetupStep('mailbox');
  };

  const handleWorkspaceSkip = () => {
    setSetupStep('mailbox');
  };

  const handleSkip = () => {
    toast({
      title: "Setup skipped",
      description: "You can add mailboxes later in settings."
    });
    navigate('/');
  };

  const handleComplete = () => {
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

  const renderMailboxList = () => {
    if (!mailboxes || mailboxes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Mail className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">No mailboxes connected yet.</p>
          <p className="text-gray-400 text-sm">Add your first mailbox to get started.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {mailboxes.map((mailbox) => (
          <div 
            key={mailbox.id}
            className="flex items-center justify-between p-3 border rounded-md bg-white"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-convo-secondary flex items-center justify-center">
                <Mail className="h-5 w-5 text-convo-primary" />
              </div>
              <div className="ml-3">
                <p className="font-medium">{mailbox.display_name || mailbox.email}</p>
                <p className="text-sm text-gray-500">{mailbox.email}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {!mailbox.is_primary && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPrimaryMailbox.mutate(mailbox.id)}
                  title="Set as primary mailbox"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              {mailbox.is_primary && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-amber-500 cursor-default"
                  title="Primary mailbox"
                >
                  <Star className="h-4 w-4 fill-amber-500" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => deleteMailbox.mutate(mailbox.id)}
                disabled={mailbox.is_primary}
                title={mailbox.is_primary ? "Cannot delete primary mailbox" : "Delete mailbox"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
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
          <Card>
            <CardHeader>
              <CardTitle>Connect Mailboxes</CardTitle>
              <CardDescription>
                Add one or more mailboxes to receive and manage your customer conversations.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderMailboxList()}
              
              <div className="border-t pt-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Mailbox
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Add New Mailbox</SheetTitle>
                      <SheetDescription>
                        Connect a mailbox to receive and respond to customer messages.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <form onSubmit={handleAddMailbox} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name (Optional)</Label>
                        <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Support Team"
                        />
                      </div>
                      
                      <SheetFooter>
                        <SheetClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </SheetClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Adding...' : 'Add Mailbox'}
                        </Button>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
              </div>
              
              {!hasPrimaryMailbox() && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No primary mailbox</AlertTitle>
                  <AlertDescription>
                    You need to add at least one mailbox and set it as primary before proceeding.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleSkip}>Skip for now</Button>
              <Button onClick={handleComplete} disabled={!hasPrimaryMailbox()}>Continue</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SetupPage;
