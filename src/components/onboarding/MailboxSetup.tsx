
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MailboxForm } from './MailboxForm';
import { MailboxList } from './MailboxList';

interface MailboxSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const MailboxSetup: React.FC<MailboxSetupProps> = ({ onComplete, onSkip }) => {
  const { hasPrimaryMailbox } = useMailboxes();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Mailboxes</CardTitle>
        <CardDescription>
          Add one or more mailboxes to receive and manage your customer conversations.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <MailboxList />
        <MailboxForm />
        
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
        <Button variant="outline" onClick={onSkip}>Skip for now</Button>
        <Button onClick={onComplete} disabled={!hasPrimaryMailbox()}>Continue</Button>
      </CardFooter>
    </Card>
  );
};
