import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Phone, Globe, UserPlus, X, CheckCircle, MailX } from 'lucide-react';
import { EmailSummary, Email, ConversationDetailResponse } from '@/types/email';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/use-customers';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { Customer, CustomerFormData } from '@/types/customer';

interface CustomerInfoProps {
  selectedEmail: string | null;
  conversation: ConversationDetailResponse | null;
  isLoading: boolean;
  error: any;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({
  selectedEmail,
  conversation,
  isLoading,
  error
}) => {
  const { toast } = useToast();
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const { 
    customers, 
    isLoading: customersLoading, 
    createCustomer,
    updateCustomer
  } = useCustomers();
  
  const [relatedCustomer, setRelatedCustomer] = useState<any>(null);
  const [customerStatus, setCustomerStatus] = useState<'unknown' | 'related' | 'irrelevant' | 'spam'>('unknown');
  
  const senderEmail = conversation?.customer?.email || 
                      (conversation?.email?.from && conversation.email.from.match(/<([^>]+)>/)?.[1]) || 
                      '';

  useEffect(() => {
    if (!senderEmail || customersLoading || !customers) return;
    
    console.log('Checking if email sender is a known customer:', senderEmail);
    
    const matchedCustomer = customers.find(c => 
      c.email?.toLowerCase() === senderEmail.toLowerCase()
    );
    
    if (matchedCustomer) {
      console.log('Found matching customer:', matchedCustomer);
      setRelatedCustomer(matchedCustomer);
      setCustomerStatus('related');
    } else {
      console.log('No matching customer found for email:', senderEmail);
      setRelatedCustomer(null);
      setCustomerStatus('unknown');
    }
  }, [senderEmail, customers, customersLoading]);
  
  useEffect(() => {
    console.log('CustomerInfo rendering with props:', {
      hasSelectedEmail: !!selectedEmail,
      selectedEmailId: selectedEmail,
      hasConversation: !!conversation,
      isLoading,
      error: error ? 'Error: ' + String(error) : 'No error',
      customerInfo: conversation?.customer ? JSON.stringify(conversation.customer).substring(0, 100) : 'No customer data',
      customerStatus
    });
  }, [selectedEmail, conversation, isLoading, error, customerStatus]);
  
  const handleMarkAsIrrelevant = () => {
    setCustomerStatus('irrelevant');
    toast({
      title: "Marked as irrelevant",
      description: "This email has been marked as irrelevant and won't be associated with a customer."
    });
  };
  
  const handleMarkAsSpam = () => {
    setCustomerStatus('spam');
    toast({
      title: "Marked as spam",
      description: "This email has been marked as spam."
    });
  };
  
  const handleCreateCustomer = (data: CustomerFormData) => {
    createCustomer.mutate({
      ...data,
      email: senderEmail
    }, {
      onSuccess: () => {
        setCustomerDialogOpen(false);
        toast({
          title: "Customer created",
          description: "A new customer record has been created for this contact."
        });
      }
    });
  };
  
  if (!selectedEmail || isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Customer Info</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading customer information...</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an email to view customer information</p>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Customer Info</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p>Error loading customer information</p>
            <p className="text-sm mt-2">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!conversation) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Customer Info</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading customer information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { customer } = conversation;
  
  const customerName = customer?.name || conversation.email.from.split('<')[0].trim();
  
  const customerCompany = customer?.company || 
    (senderEmail && !senderEmail.includes('@gmail.com') && !senderEmail.includes('@outlook.com') && !senderEmail.includes('@yahoo.com') ? 
      senderEmail.split('@')[1].split('.')[0].charAt(0).toUpperCase() + senderEmail.split('@')[1].split('.')[0].slice(1) : 
      undefined);
  
  const inferredWebsite = senderEmail && !senderEmail.includes('@gmail.com') && !senderEmail.includes('@outlook.com') && !senderEmail.includes('@yahoo.com') ?
    `https://www.${senderEmail.split('@')[1]}` : 
    undefined;
  
  const totalMessages = conversation.messages?.length || 0;
  
  const initials = customerName
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Customer Info</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <span className="text-lg font-semibold">{initials}</span>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{customerName}</h3>
            {customerCompany && (
              <p className="text-sm text-muted-foreground">{customerCompany}</p>
            )}
            {customerStatus === 'related' && (
              <Badge className="bg-green-500 mt-1">Existing Customer</Badge>
            )}
            {customerStatus === 'irrelevant' && (
              <Badge variant="outline" className="mt-1">Marked as Irrelevant</Badge>
            )}
            {customerStatus === 'spam' && (
              <Badge variant="destructive" className="mt-1">Marked as Spam</Badge>
            )}
          </div>
        </div>
        
        {customerStatus === 'unknown' && (
          <div className="flex flex-col gap-2 mt-4">
            <h4 className="text-sm font-semibold mb-1">Actions</h4>
            <div className="flex gap-2">
              <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1" variant="default">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Customer</DialogTitle>
                  </DialogHeader>
                  <CustomerForm 
                    initialData={{
                      name: customerName,
                      email: senderEmail,
                      company: customerCompany || null,
                      phone: null,
                      status: 'active',
                      notes: null
                    }}
                    onSubmit={handleCreateCustomer}
                    onCancel={() => setCustomerDialogOpen(false)}
                    isSubmitting={createCustomer.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={handleMarkAsIrrelevant}>
                <X className="h-4 w-4 mr-2" />
                Mark Irrelevant
              </Button>
              <Button className="flex-1" variant="destructive" onClick={handleMarkAsSpam}>
                <MailX className="h-4 w-4 mr-2" />
                Mark as Spam
              </Button>
            </div>
          </div>
        )}
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Contact Details</h4>
          
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{senderEmail}</span>
          </div>
          
          {relatedCustomer?.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{relatedCustomer.phone}</span>
            </div>
          )}
          
          {(inferredWebsite || relatedCustomer?.website) && (
            <div className="flex items-center space-x-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {relatedCustomer?.website || inferredWebsite}
              </span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Message History</h4>
          <p className="text-sm text-muted-foreground">
            {totalMessages} message{totalMessages !== 1 ? 's' : ''} in this thread
          </p>
          <p className="text-sm text-muted-foreground">
            First message: {format(new Date(conversation.messages[0].date), 'MMM dd, yyyy')}
          </p>
          {totalMessages > 1 && (
            <p className="text-sm text-muted-foreground">
              Last message: {format(new Date(conversation.messages[totalMessages - 1].date), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
        
        {relatedCustomer?.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Notes</h4>
              <p className="text-sm text-muted-foreground">
                {relatedCustomer.notes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
