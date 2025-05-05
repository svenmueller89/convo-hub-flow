
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Phone, Globe } from 'lucide-react';
import { EmailSummary, Email, ConversationDetailResponse } from '@/types/email';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/use-customers';
import { useEmails } from '@/hooks/emails';
import { format } from 'date-fns';
import { Customer } from '@/types/customer';

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
  const { 
    customers, 
    isLoading: customersLoading
  } = useCustomers();
  
  const { allEmails } = useEmails();
  
  const [relatedCustomer, setRelatedCustomer] = useState<Customer | null>(null);
  const [customerStatus, setCustomerStatus] = useState<'unknown' | 'related' | 'irrelevant' | 'spam'>('unknown');
  const [hasActiveConversation, setHasActiveConversation] = useState(false);
  
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
      
      // Check if there's an active conversation for this customer
      if (allEmails && selectedEmail) {
        const currentEmail = allEmails.find(e => e.id === selectedEmail);
        if (currentEmail) {
          const conversationId = currentEmail.conversation_id;
          
          // Look for other emails in this conversation that are marked as in-progress
          const activeEmails = allEmails.filter(e => 
            e.conversation_id === conversationId && 
            e.status === 'in-progress' &&
            e.id !== selectedEmail
          );
          
          setHasActiveConversation(activeEmails.length > 0);
        }
      }
    } else {
      console.log('No matching customer found for email:', senderEmail);
      setRelatedCustomer(null);
      setCustomerStatus('unknown');
    }
  }, [senderEmail, customers, customersLoading, allEmails, selectedEmail]);
  
  useEffect(() => {
    console.log('CustomerInfo rendering with props:', {
      hasSelectedEmail: !!selectedEmail,
      selectedEmailId: selectedEmail,
      hasConversation: !!conversation,
      isLoading,
      error: error ? 'Error: ' + String(error) : 'No error',
      customerInfo: conversation?.customer ? JSON.stringify(conversation.customer).substring(0, 100) : 'No customer data',
      customerStatus,
      hasActiveConversation
    });
  }, [selectedEmail, conversation, isLoading, error, customerStatus, hasActiveConversation]);
  
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
