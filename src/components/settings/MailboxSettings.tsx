
import React, { useState } from 'react';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Plus, Search } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mailbox, MailboxFormData } from '@/types/mailbox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MailboxCard from './MailboxCard';
import MailboxForm from './MailboxForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MailboxSettings: React.FC = () => {
  const { 
    mailboxes, 
    isLoading, 
    addMailbox, 
    deleteMailbox, 
    updateMailbox,
    setPrimaryMailbox, 
    hasPrimaryMailbox 
  } = useMailboxes();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentMailbox, setCurrentMailbox] = useState<Mailbox | null>(null);

  const handleAddMailbox = async (formData: MailboxFormData) => {
    await addMailbox.mutateAsync(formData);
    setIsAddDialogOpen(false);
  };

  const handleEditMailbox = async (formData: MailboxFormData) => {
    if (!currentMailbox) return;
    await updateMailbox.mutateAsync({ id: currentMailbox.id, formData });
    setIsEditDialogOpen(false);
  };

  const handleOpenEditDialog = (mailbox: Mailbox) => {
    setCurrentMailbox(mailbox);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (id: string) => {
    const mailbox = mailboxes?.find(m => m.id === id);
    if (mailbox) {
      setCurrentMailbox(mailbox);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (currentMailbox) {
      await deleteMailbox.mutateAsync(currentMailbox.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const filteredMailboxes = mailboxes?.filter(mailbox => {
    return mailbox.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (mailbox.display_name && mailbox.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (isLoading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-convo-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Your Mailboxes</h3>
          <p className="text-sm text-gray-500">Connect your email accounts to receive and send messages</p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Mailbox
        </Button>
      </div>
      
      {mailboxes && mailboxes.length > 0 ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search mailboxes..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-3 mt-4">
            {filteredMailboxes?.map((mailbox) => (
              <MailboxCard 
                key={mailbox.id} 
                mailbox={mailbox}
                onDelete={handleOpenDeleteDialog}
                onEdit={handleOpenEditDialog}
                onSetPrimary={(id) => setPrimaryMailbox.mutate(id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
          <Mail className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">No mailboxes connected yet</p>
          <p className="text-gray-400 text-sm mb-4">Add your first mailbox to get started with customer conversations</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Mailbox
          </Button>
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

      {/* Add Mailbox Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} modal>
        <DialogContent 
          className="sm:max-w-3xl"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add New Mailbox</DialogTitle>
            <DialogDescription>
              Connect a mailbox to receive and respond to customer messages.
            </DialogDescription>
          </DialogHeader>
          <MailboxForm 
            onSubmit={handleAddMailbox} 
            onCancel={() => setIsAddDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Edit Mailbox Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} modal>
        <DialogContent 
          className="sm:max-w-3xl"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Mailbox</DialogTitle>
            <DialogDescription>
              Update your mailbox connection settings.
            </DialogDescription>
          </DialogHeader>
          {currentMailbox && (
            <MailboxForm 
              key={currentMailbox.id} // Force re-render when mailbox changes
              initialData={currentMailbox}
              onSubmit={handleEditMailbox} 
              onCancel={() => setIsEditDialogOpen(false)}
              isEditing 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove mailbox?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect '{currentMailbox?.display_name || currentMailbox?.email}'?
              All fetched emails will remain in ConvoHub, but no new emails will be pulled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Remove Mailbox
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MailboxSettings;
