
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { supabase } from '@/integrations/supabase/client';
import { useCustomers } from '@/hooks/use-customers';
import { Search } from 'lucide-react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define the form schema
const formSchema = z.object({
  to: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  message: z.string().min(1, { message: 'Message is required' }),
});

type FormValues = z.infer<typeof formSchema>;

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewConversationDialog: React.FC<NewConversationDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mailboxes, hasPrimaryMailbox } = useMailboxes();
  const { customers, isLoading: customersLoading } = useCustomers();
  const [openCombobox, setOpenCombobox] = useState(false);
  
  // Get the primary mailbox
  const primaryMailbox = mailboxes?.find(mailbox => mailbox.is_primary);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    // Check if we have a primary mailbox
    if (!hasPrimaryMailbox()) {
      toast({
        title: "No primary mailbox found",
        description: "Please set up a mailbox first in Settings",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call the edge function to send email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          mailboxId: primaryMailbox?.id,
          to: values.to,
          subject: values.subject,
          message: values.message
        }
      });
      
      if (error) {
        console.error('Error sending email:', error);
        throw error;
      }
      
      // Show success message
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully"
      });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset the form
      form.reset();
      
      // Navigate to conversations page (optional)
      navigate('/conversations');
      
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        title: "Failed to send email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle selecting a customer from dropdown
  const handleSelectCustomer = (email: string) => {
    form.setValue('to', email);
    setOpenCombobox(false);
  };
  
  // Check if we have a primary mailbox
  const canCreateConversation = hasPrimaryMailbox();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        
        {!canCreateConversation ? (
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">Please set up a mailbox first in the Settings page.</p>
            <Button onClick={() => {
              onOpenChange(false);
              navigate('/settings');
            }}>
              Go to Settings
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            placeholder="recipient@example.com" 
                            {...field} 
                          />
                          
                          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                type="button"
                                className="absolute right-0 top-0 h-full px-3 py-2"
                                onClick={() => setOpenCombobox(true)}
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
                              <Command>
                                <CommandInput placeholder="Search for customers..." />
                                <CommandList>
                                  <CommandEmpty>No customers found</CommandEmpty>
                                  <CommandGroup heading="Customers">
                                    {customersLoading ? (
                                      <div className="p-2 text-center text-sm">Loading customers...</div>
                                    ) : (
                                      customers?.filter(customer => customer.email).map(customer => (
                                        <CommandItem
                                          key={customer.id}
                                          value={customer.email || ''}
                                          onSelect={() => handleSelectCustomer(customer.email || '')}
                                        >
                                          <div className="flex flex-col">
                                            <span>{customer.name}</span>
                                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                                          </div>
                                        </CommandItem>
                                      ))
                                    )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your message here..." 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
