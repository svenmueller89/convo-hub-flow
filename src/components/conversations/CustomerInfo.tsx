
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, Mail, Phone, ExternalLink, Calendar, MessageSquare } from 'lucide-react';
import { ConversationDetailResponse } from '@/types/email';

interface CustomerInfoProps {
  selectedEmail: string | null;
  conversation: ConversationDetailResponse | null;
  isLoading: boolean;
  error: unknown;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ 
  selectedEmail, 
  conversation, 
  isLoading, 
  error 
}) => {
  // Debug logging
  useEffect(() => {
    console.log('CustomerInfo rendering with props:', {
      hasSelectedEmail: !!selectedEmail,
      selectedEmailId: selectedEmail,
      hasConversation: !!conversation,
      isLoading,
      error: error ? String(error) : 'No error',
      customerInfo: conversation?.customer ? JSON.stringify(conversation.customer) : 'No customer data'
    });
  }, [selectedEmail, conversation, isLoading, error]);

  // Show placeholder when no email is selected
  if (!selectedEmail) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Customer Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Select a conversation to view customer details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show loading state when conversation is loading
  if (isLoading) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading customer information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show error state if conversation failed to load
  if (error || !conversation) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was an error loading the customer information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have no customer data in conversation
  if (!conversation.customer) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Customer Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No customer information available
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract email domain for company website if company is not provided
  const emailDomain = conversation.customer.email ? 
    conversation.customer.email.split('@')[1] : null;
  const inferredWebsite = emailDomain ? `www.${emailDomain}` : null;
  
  // Use the first message date as customer since date
  const customerSinceDate = conversation.messages && conversation.messages.length > 0 
    ? new Date(conversation.messages[0].date) 
    : new Date();
  
  // Format the customer since date as month and year
  const customerSince = customerSinceDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Build customer data from conversation
  const customer = {
    name: conversation.customer.company || conversation.customer.name,
    email: conversation.customer.email,
    phone: conversation.customer.id.includes('cust-') ? "+1 (555) 123-4567" : "Not available", // Placeholder phone
    website: inferredWebsite,
    status: "Active",
    customerSince: customerSince,
    totalConversations: conversation.messages.length,
    lastContact: new Date(conversation.email.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    notes: conversation.customer.company 
      ? `${conversation.customer.name} from ${conversation.customer.company}` 
      : `Individual customer`,
    recentConversations: [
      { 
        id: conversation.email.conversation_id, 
        subject: conversation.email.subject, 
        date: new Date(conversation.email.date).toLocaleDateString() 
      }
    ],
    contacts: [
      { 
        name: conversation.customer.name, 
        role: conversation.customer.company ? "Primary Contact" : "Customer", 
        email: conversation.customer.email 
      }
    ]
  };

  // Get initials from name for avatar
  const initials = customer.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="h-full">
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-convo-secondary text-convo-primary">
                <span className="font-medium">{initials}</span>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{customer.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
            </div>
            <Badge>{customer.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-5rem)] overflow-y-auto">
          <Tabs defaultValue="details">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Company</span>
                </div>
                <p className="text-sm pl-6">{conversation.customer.company || 'Individual Customer'}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email</span>
                </div>
                <p className="text-sm pl-6">{customer.email}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Phone</span>
                </div>
                <p className="text-sm pl-6">{customer.phone}</p>
              </div>
              
              {customer.website && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Website</span>
                  </div>
                  <p className="text-sm pl-6">{customer.website}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Customer Information</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Customer Since</p>
                    <p className="text-sm">{customer.customerSince}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Messages</p>
                    <p className="text-sm">{customer.totalConversations}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Contact</p>
                    <p className="text-sm">{customer.lastContact}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm">{customer.notes}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="p-4 space-y-4">
              <p className="text-sm font-medium">Conversation History</p>
              <div className="space-y-3">
                {conversation.messages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <div className="bg-gray-100 p-1 rounded">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{message.subject}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(message.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{message.body.substring(0, 60)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="contacts" className="p-4 space-y-4">
              <p className="text-sm font-medium">{conversation.customer.company ? 'Company Contacts' : 'Contact Information'}</p>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{conversation.customer.name}</p>
                  <p className="text-xs text-gray-500">{conversation.customer.company ? 'Primary Contact' : 'Customer'}</p>
                  <p className="text-xs text-convo-primary">{conversation.customer.email}</p>
                </div>
                {conversation.customer.company && (
                  <div className="p-4 border border-dashed rounded-md">
                    <p className="text-xs text-gray-500 text-center">
                      No additional contacts available for {conversation.customer.company}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
