
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyWorkspaceProps {
  workspaceName: string;
}

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({ workspaceName }) => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Workspace Dashboard – {workspaceName}</h1>
      <p className="text-gray-500 mb-6">No mailboxes or users yet. Let's get started!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Add Mailbox
            </CardTitle>
            <CardDescription>
              Connect your email accounts to receive and respond to customer conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/setup')}
            >
              Add Mailbox
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Invite Team Members
            </CardTitle>
            <CardDescription>
              Invite your teammates to collaborate on customer conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/settings')}
            >
              Invite Team Members
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
