
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, Mail, Phone, ExternalLink, Calendar, MessageSquare } from 'lucide-react';
import { useEmails } from '@/hooks/use-emails';

export const CustomerInfo: React.FC = () => {
  const { conversation, conversationLoading, selectedEmail } = useEmails();
  
  // Debug logging
  useEffect(() => {
    console.log('CustomerInfo rendering with:', {
      hasSelectedEmail: !!selectedEmail,
      selectedEmailId: selectedEmail,
      hasConversation: !!conversation,
      conversationLoading,
      customerInfo: conversation?.customer ? JSON.stringify(conversation.customer) : 'No customer data'
    });
  }, [selectedEmail, conversation, conversationLoading]);

  // Show placeholder or loading state when no customer info is available
  if (conversationLoading) {
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

  if (!conversation || !conversation.customer) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Customer Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {selectedEmail ? 'Loading customer details...' : 'Select a conversation to view customer details'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the customer data from the conversation
  const customer = {
    name: conversation.customer.company || conversation.customer.name,
    email: conversation.customer.email,
    phone: "+1 (555) 123-4567", // Mock data
    website: "www.acmeinc.com", // Mock data
    status: "Active",
    customerSince: "Jan 2023",
    totalConversations: 12,
    lastContact: "March 1, 2025",
    notes: "Enterprise client, dedicated support representative assigned.",
    recentConversations: [
      { id: conversation.email.conversation_id, subject: conversation.email.subject, date: new Date(conversation.email.date).toLocaleDateString() },
      { id: "2", subject: "Monthly Newsletter Setup", date: "Feb 15, 2025" },
      { id: "3", subject: "Support Subscription Renewal", date: "Jan 28, 2025" }
    ],
    contacts: [
      { name: conversation.customer.name, role: "Primary Contact", email: conversation.customer.email },
      { name: "Sarah Lee", role: "CEO", email: "sarah@acmeinc.com" }
    ]
  };

  return (
    <div className="h-full">
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-convo-secondary text-convo-primary">
                <span className="font-medium">{customer.name.substring(0, 2).toUpperCase()}</span>
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
                <p className="text-sm pl-6">{customer.name}</p>
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
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Website</span>
                </div>
                <p className="text-sm pl-6">{customer.website}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Customer Information</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Customer Since</p>
                    <p className="text-sm">{customer.customerSince}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Conversations</p>
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
              <p className="text-sm font-medium">Recent Conversations</p>
              <div className="space-y-3">
                {customer.recentConversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-start gap-3">
                    <div className="bg-gray-100 p-1 rounded">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{conversation.subject}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{conversation.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="contacts" className="p-4 space-y-4">
              <p className="text-sm font-medium">Company Contacts</p>
              <div className="space-y-4">
                {customer.contacts.map((contact, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-sm font-medium">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role}</p>
                    <p className="text-xs text-convo-primary">{contact.email}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
