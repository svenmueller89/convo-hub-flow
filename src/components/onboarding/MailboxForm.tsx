
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { useAuth } from '@/contexts/AuthContext';
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

export const MailboxForm: React.FC = () => {
  const { user } = useAuth();
  const { addMailbox, hasPrimaryMailbox } = useMailboxes();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  return (
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
  );
};
