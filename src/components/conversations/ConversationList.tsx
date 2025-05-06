
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, ArrowUpDown, Paperclip } from 'lucide-react';
import { useConversations } from '@/hooks/use-conversations';
import { StatusDropdown } from './StatusDropdown';
import { useConversationStatuses } from '@/hooks/use-conversation-statuses';
import { useConversationStatus } from '@/hooks/use-conversation-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConversationItemProps {
  id: string;
  conversation_id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  status: string;
  selected?: boolean;
  hasAttachments: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  id,
  conversation_id,
  from,
  subject,
  preview,
  date,
  status,
  selected,
  hasAttachments,
  onClick,
}) => {
  const { statuses = [] } = useConversationStatuses();
  const { updateConversationStatus } = useConversationStatus();
  
  const fromName = from.split('<')[0].trim();
  const initials = fromName
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });
  
  const currentStatus = statuses.find(s => s.name.toLowerCase() === status) || {
    id: '0',
    name: status.charAt(0).toUpperCase() + status.slice(1),
    color: status === 'in-progress' ? '#3B82F6' : status === 'resolved' ? '#10B981' : '#6B7280',
    is_default: false,
    display_order: 0,
    created_at: '',
    updated_at: ''
  };

  const handleStatusChange = async (statusId: string) => {
    await updateConversationStatus.mutateAsync({
      conversationId: conversation_id,
      statusId
    });
  };
  
  return (
    <div 
      className={cn(
        "p-3 border-b border-gray-200 cursor-pointer",
        selected ? "bg-convo-secondary" : "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 bg-convo-gray-200">
          <span className="text-xs font-medium">{initials}</span>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium truncate">
              {fromName}
            </p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
          
          <p className="text-sm font-medium truncate">{subject}</p>
          
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 truncate max-w-[70%]">{preview}</p>
            <div className="flex items-center space-x-2">
              {hasAttachments && (
                <Paperclip className="h-3 w-3 text-gray-400" />
              )}
              <StatusDropdown 
                currentStatus={currentStatus}
                allStatuses={statuses}
                onChangeStatus={handleStatusChange}
                className="ml-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  selectedConversationId, 
  onSelectConversation 
}) => {
  const { 
    conversations, 
    isLoading, 
    filter, 
    setFilter, 
    search, 
    setSearch, 
    sortBy, 
    setSortBy 
  } = useConversations();
  
  // Filter out emails without a status
  const statusFilteredConversations = conversations.filter(conv => 
    conv.status && conv.status !== 'new'
  );

  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex flex-col">
      <div className="border-b p-3 space-y-3">
        <h2 className="text-lg font-semibold">Conversations</h2>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('in-progress')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('resolved')}>
                Resolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger 
              value="all" 
              onClick={() => setFilter('all')}
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="in-progress" 
              onClick={() => setFilter('in-progress')}
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger 
              value="resolved" 
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        ) : statusFilteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations found</p>
          </div>
        ) : (
          statusFilteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              id={conversation.id}
              conversation_id={conversation.conversation_id}
              from={conversation.from}
              subject={conversation.subject}
              preview={conversation.preview}
              date={conversation.date}
              status={conversation.status}
              selected={selectedConversationId === conversation.conversation_id}
              hasAttachments={conversation.has_attachments}
              onClick={() => onSelectConversation(conversation.conversation_id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
