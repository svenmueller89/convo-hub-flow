
import React from 'react';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { Button } from '@/components/ui/button';
import { Mail, Plus, Star, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MailboxSettings: React.FC = () => {
  const { mailboxes, isLoading, addMailbox, deleteMailbox, setPrimaryMailbox, hasPrimaryMailbox } = useMailboxes();
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

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
      
      toast({
        title: "Mailbox added",
        description: "Your mailbox has been added successfully."
      });
    } catch (error) {
      console.error("Failed to add mailbox:", error);
      toast({
        title: "Failed to add mailbox",
        description: "There was an error adding your mailbox. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-convo-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Your Mailboxes</h3>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
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

      {mailboxes && mailboxes.length > 0 ? (
        <div className="space-y-3 mt-4">
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
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
          <Mail className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">No mailboxes connected yet</p>
          <p className="text-gray-400 text-sm mb-4">Add your first mailbox to get started with customer conversations</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Mailbox
              </Button>
            </SheetTrigger>
            <SheetContent>
              {/* Same sheet content as above */}
              <SheetHeader>
                <SheetTitle>Add New Mailbox</SheetTitle>
                <SheetDescription>
                  Connect a mailbox to receive and respond to customer messages.
                </SheetDescription>
              </SheetHeader>
              
              <form onSubmit={handleAddMailbox} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email2">Email Address</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName2">Display Name (Optional)</Label>
                  <Input
                    id="displayName2"
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
      )}

      {!hasPrimaryMailbox() && mailboxes && mailboxes.length > 0 && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No primary mailbox</AlertTitle>
          <AlertDescription>
            You need to set one of your mailboxes as primary to receive messages.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MailboxSettings;
