
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, Send, Paperclip } from 'lucide-react';

const ConversationReply: React.FC = () => {
  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <ArrowUp className="mr-1 h-4 w-4" />
              Reply
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button variant="ghost" size="sm">Note</Button>
            <Button variant="ghost" size="sm">Forward</Button>
          </div>
          <div>
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md bg-white">
          <Textarea 
            placeholder="Type your reply..."
            className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={5}
          />
          
          <div className="flex justify-between items-center p-2 border-t">
            <div></div>
            <Button>
              <Send className="mr-1 h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationReply;
