
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { StatusColorPicker } from './StatusColorPicker';
import { ConversationStatus, ConversationStatusFormData } from '@/types/conversation-status';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  name: z.string()
    .min(1, { message: "Name is required" })
    .max(30, { message: "Name cannot exceed 30 characters" }),
  color: z.string().min(1, { message: "Color is required" }),
  is_default: z.boolean().optional(),
});

interface StatusFormProps {
  defaultValues?: ConversationStatus;
  onSubmit: (data: ConversationStatusFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function StatusForm({ 
  defaultValues,
  onSubmit,
  isSubmitting,
  onCancel,
}: StatusFormProps) {
  const form = useForm<ConversationStatusFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ? {
      name: defaultValues.name,
      color: defaultValues.color,
      is_default: defaultValues.is_default,
    } : {
      name: '',
      color: '#3B82F6', // Default blue
      is_default: false,
    },
  });

  const handleSubmit = (data: ConversationStatusFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Needs Customer Feedback" 
                  {...field} 
                  maxLength={30}
                />
              </FormControl>
              <FormDescription>
                The name your team will see for this status (max 30 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <StatusColorPicker 
                  value={field.value} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormDescription>
                Choose a color to represent this status
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Set as default status for new conversations
                </FormLabel>
                <FormDescription>
                  New conversations will automatically get this status
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {defaultValues ? "Update Status" : "Save Status"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
