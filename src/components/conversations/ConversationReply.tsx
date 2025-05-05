
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, X, AlertTriangle } from 'lucide-react';
import { useEmails } from '@/hooks/emails'; // Updated import path
import { useToast } from '@/hooks/use-toast';

const ConversationReply: React.FC = () => {
  const { selectedEmail, markAsIrrelevant, markAsSpam, setEmailStatus } = useEmails();
  const { toast } = useToast();
  
  const handleMarkAsCustomer = () => {
    if (selectedEmail) {
      setEmailStatus.mutate(
        { emailId: selectedEmail, status: 'in-progress' },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Email marked as customer-related",
            });
          }
        }
      );
    }
  };
  
  const handleMarkAsIrrelevant = () => {
    if (selectedEmail) {
      markAsIrrelevant.mutate(selectedEmail, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Email marked as irrelevant",
          });
        }
      });
    }
  };
  
  const handleMarkAsSpam = () => {
    if (selectedEmail) {
      markAsSpam.mutate(selectedEmail, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Email marked as spam",
          });
        }
      });
    }
  };
  
  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4">
          <h3 className="font-medium text-sm">Classify this email:</h3>
          
          <div className="flex gap-3 justify-center">
            <Button 
              variant="default" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleMarkAsCustomer}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Customer
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleMarkAsIrrelevant}
            >
              <X className="mr-2 h-4 w-4" />
              Not Relevant
            </Button>
            
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleMarkAsSpam}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Mark as Spam
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationReply;
