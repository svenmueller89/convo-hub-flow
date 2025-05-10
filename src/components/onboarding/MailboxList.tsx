
import React from 'react';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { Button } from '@/components/ui/button';
import { Mail, Star, Trash2 } from 'lucide-react';

export const MailboxList: React.FC = () => {
  const { mailboxes, deleteMailbox, setPrimaryMailbox } = useMailboxes();

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
