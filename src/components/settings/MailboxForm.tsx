
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { MailboxFormData, Mailbox, MailboxTestResult } from '@/types/mailbox';
import { useToast } from '@/hooks/use-toast';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const mailboxSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  display_name: z.string().optional(),
  is_primary: z.boolean().optional(),
  imap_host: z.string().min(1, { message: "IMAP host is required" }),
  imap_port: z.coerce.number().int().min(1).max(65535),
  imap_encryption: z.enum(['SSL/TLS', 'STARTTLS', 'None']),
  smtp_host: z.string().min(1, { message: "SMTP host is required" }),
  smtp_port: z.coerce.number().int().min(1).max(65535),
  smtp_encryption: z.enum(['SSL/TLS', 'STARTTLS', 'None']),
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().optional(),
});

interface MailboxFormProps {
  initialData?: Partial<Mailbox>;
  onSubmit: (data: MailboxFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const MailboxForm: React.FC<MailboxFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isEditing = false 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<MailboxTestResult | null>(null);
  const { toast } = useToast();
  const { testMailboxConnection } = useMailboxes();
  
  const form = useForm<MailboxFormData>({
    resolver: zodResolver(mailboxSchema),
    defaultValues: {
      email: initialData?.email || '',
      display_name: initialData?.display_name || '',
      is_primary: initialData?.is_primary || false,
      imap_host: initialData?.imap_host || '',
      imap_port: initialData?.imap_port || 993,
      imap_encryption: (initialData?.imap_encryption as any) || 'SSL/TLS',
      smtp_host: initialData?.smtp_host || '',
      smtp_port: initialData?.smtp_port || 587,
      smtp_encryption: (initialData?.smtp_encryption as any) || 'SSL/TLS',
      username: initialData?.username || '',
      password: '',
    }
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        email: initialData.email || '',
        display_name: initialData.display_name || '',
        is_primary: initialData.is_primary || false,
        imap_host: initialData.imap_host || '',
        imap_port: initialData.imap_port || 993,
        imap_encryption: (initialData.imap_encryption as any) || 'SSL/TLS',
        smtp_host: initialData.smtp_host || '',
        smtp_port: initialData.smtp_port || 587,
        smtp_encryption: (initialData.smtp_encryption as any) || 'SSL/TLS',
        username: initialData.username || '',
        password: '',
      });
    }
  }, [initialData, form]);

  const handleTestConnection = async () => {
    const formData = form.getValues();
    const isFormValid = await form.trigger();
    
    if (!isFormValid) {
      toast({
        title: "Form has errors",
        description: "Please fill out all required fields correctly before testing.",
        variant: "destructive"
      });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testMailboxConnection(formData);
      
      setTestResult(result);
      toast({
        title: "Connection test complete",
        description: result.success 
          ? "IMAP & SMTP connected successfully." 
          : result.message,
        variant: result.success ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error("Connection test failed:", error);
      const errorResult: MailboxTestResult = {
        success: false,
        message: "Connection test failed"
      };
      setTestResult(errorResult);
      toast({
        title: "Connection test failed",
        description: "There was an error testing the connection. Please check your settings and try again.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (data: MailboxFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-md font-medium">Email Account Details</h3>
            
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Support, Sales, Info" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name for this mailbox
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Usually the same as email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormDescription>
                    {isEditing && "Leave blank to keep current password"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium">IMAP Settings</h3>
              <p className="text-sm text-muted-foreground">For receiving emails</p>
            </div>
            
            <FormField
              control={form.control}
              name="imap_host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMAP Host</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. imap.gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imap_port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Port</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="993" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imap_encryption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Encryption</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select encryption" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SSL/TLS">SSL/TLS</SelectItem>
                        <SelectItem value="STARTTLS">STARTTLS</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-4">
              <h3 className="text-md font-medium">SMTP Settings</h3>
              <p className="text-sm text-muted-foreground">For sending emails</p>
            </div>
            
            <FormField
              control={form.control}
              name="smtp_host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMTP Host</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. smtp.gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtp_port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Port</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="587" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="smtp_encryption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Encryption</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select encryption" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SSL/TLS">SSL/TLS</SelectItem>
                        <SelectItem value="STARTTLS">STARTTLS</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {testResult && (
          <div className={`rounded-md p-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <div>
                <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
                {testResult.details && (
                  <div className="mt-1 text-xs">
                    {testResult.details.imap && (
                      <p className={testResult.details.imap.success ? 'text-green-700' : 'text-red-700'}>
                        IMAP: {testResult.details.imap.message}
                      </p>
                    )}
                    {testResult.details.smtp && (
                      <p className={testResult.details.smtp.success ? 'text-green-700' : 'text-red-700'}>
                        SMTP: {testResult.details.smtp.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={isTesting || isSubmitting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  {isEditing ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                isEditing ? 'Update Mailbox' : 'Save Mailbox'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default MailboxForm;
