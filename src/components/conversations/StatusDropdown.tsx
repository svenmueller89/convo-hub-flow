
import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ConversationStatus } from '@/types/conversation-status';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StatusDropdownProps {
  currentStatus: ConversationStatus;
  allStatuses: ConversationStatus[];
  onChangeStatus: (statusId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export const StatusDropdown = ({ 
  currentStatus, 
  allStatuses, 
  onChangeStatus,
  disabled = false,
  className
}: StatusDropdownProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeStatusId, setActiveStatusId] = useState(currentStatus.id);

  const handleChangeStatus = async (statusId: string) => {
    if (statusId === activeStatusId) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onChangeStatus(statusId);
      setActiveStatusId(statusId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusObj = allStatuses.find(status => status.id === activeStatusId) || currentStatus;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <Button 
          variant="ghost" 
          className={cn("p-0 h-auto hover:bg-transparent", className)} 
          title={`Current status: ${currentStatusObj.name} - click to change`}
        >
          <StatusBadge 
            status={currentStatusObj} 
            className={cn(
              "cursor-pointer transition-opacity",
              isUpdating ? "opacity-70" : ""
            )} 
          />
          <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {allStatuses.sort((a, b) => a.display_order - b.display_order).map(status => (
          <DropdownMenuItem
            key={status.id}
            disabled={isUpdating}
            className="flex items-center gap-2"
            onClick={() => handleChangeStatus(status.id)}
          >
            <div className={cn(
              "h-3 w-3 rounded-full",
              activeStatusId === status.id ? "visible" : "invisible"
            )}>
              {activeStatusId === status.id && <Check className="h-3 w-3" />}
            </div>
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
            <span>{status.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
