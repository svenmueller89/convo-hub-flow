
import React, { useState } from 'react';
import { Customer } from '@/types/customer';
import { useCustomerInteractions } from '@/hooks/use-customer-interactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { MessageSquare, Trash2, Loader2, History, FileText, Phone } from 'lucide-react';
import { CustomerInteractionFormData } from '@/types/customer-interaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';

interface CustomerInteractionsProps {
  customer: Customer;
}

export const CustomerInteractions = ({ customer }: CustomerInteractionsProps) => {
  const { interactions, isLoading, error, addInteraction, deleteInteraction } = useCustomerInteractions(customer.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CustomerInteractionFormData>({
    defaultValues: {
      content: '',
      interaction_type: 'note'
    }
  });

  const onSubmit = async (data: CustomerInteractionFormData) => {
    setIsSubmitting(true);
    await addInteraction.mutateAsync(data);
    form.reset();
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this interaction?')) {
      await deleteInteraction.mutateAsync(id);
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <History className="h-4 w-4" />;
      case 'email':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (error) {
    return <div className="text-destructive">Error loading interactions: {error.message}</div>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Customer Interactions</CardTitle>
        <CardDescription>Record notes, calls, meetings and emails with this customer</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="interaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter details about your interaction with the customer..." 
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Interaction
            </Button>
          </form>
        </Form>

        <Separator className="my-4" />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">History</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : interactions && interactions.length > 0 ? (
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="border rounded-md p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getInteractionIcon(interaction.interaction_type)}
                        <span className="capitalize">{interaction.interaction_type}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(interaction.created_at), 'MMM d, yyyy - h:mm a')}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(interaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <p className="text-sm whitespace-pre-wrap">{interaction.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No interactions recorded for this customer yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
