
import React, { useState } from 'react';
import { useConversationStatuses } from '@/hooks/use-conversation-statuses';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2, GripVertical, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusForm } from './StatusForm';
import { ConversationStatus, ConversationStatusFormData } from '@/types/conversation-status';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ConversationStatusSettings() {
  const { 
    statuses = [], 
    isLoading, 
    addStatus, 
    updateStatus, 
    deleteStatus,
    updateStatusOrder,
  } = useConversationStatuses();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<ConversationStatus | null>(null);
  const [deleteDialogStatus, setDeleteDialogStatus] = useState<ConversationStatus | null>(null);

  const handleAdd = (formData: ConversationStatusFormData) => {
    addStatus.mutate(formData, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
      }
    });
  };

  const handleEdit = (formData: ConversationStatusFormData) => {
    if (editStatus) {
      updateStatus.mutate({
        id: editStatus.id,
        formData,
      }, {
        onSuccess: () => {
          setEditStatus(null);
        }
      });
    }
  };

  const handleDelete = (status: ConversationStatus) => {
    deleteStatus.mutate(status.id, {
      onSuccess: () => {
        setDeleteDialogStatus(null);
      }
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    if (result.destination.index === result.source.index) return;

    const reorderedStatuses = Array.from(statuses);
    const [movedStatus] = reorderedStatuses.splice(result.source.index, 1);
    reorderedStatuses.splice(result.destination.index, 0, movedStatus);
    
    // Update the display order
    updateStatusOrder.mutate(reorderedStatuses);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Conversation Statuses</h3>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Status
          </Button>
        </div>
        
        <div className="rounded-md border">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="statuses">
              {(provided) => (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-28">Color</TableHead>
                      <TableHead className="w-28">Default</TableHead>
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                    {statuses.map((status, index) => (
                      <Draggable 
                        key={status.id} 
                        draggableId={status.id} 
                        index={index}
                      >
                        {(provided) => (
                          <TableRow 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <TableCell className="px-2">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab flex items-center justify-center h-full"
                              >
                                <GripVertical size={16} className="text-gray-400" />
                              </div>
                            </TableCell>
                            <TableCell>{status.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-4 w-4 rounded-full"
                                  style={{ backgroundColor: status.color }}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {status.color}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {status.is_default && (
                                <div className="flex items-center text-green-600">
                                  <Check size={16} className="mr-1" /> Yes
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditStatus(status)}
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setDeleteDialogStatus(status)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        
        {statuses.length === 0 && (
          <div className="text-center py-4 border rounded-md">
            <p className="text-muted-foreground">No custom statuses defined</p>
            <Button 
              variant="link" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add your first status
            </Button>
          </div>
        )}
      </div>

      {/* Add Status Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Status</DialogTitle>
            <DialogDescription>
              Create a new conversation status for your workflow.
            </DialogDescription>
          </DialogHeader>
          <StatusForm
            onSubmit={handleAdd}
            isSubmitting={addStatus.isPending}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog 
        open={!!editStatus} 
        onOpenChange={(open) => !open && setEditStatus(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Update this conversation status.
            </DialogDescription>
          </DialogHeader>
          {editStatus && (
            <StatusForm
              defaultValues={editStatus}
              onSubmit={handleEdit}
              isSubmitting={updateStatus.isPending}
              onCancel={() => setEditStatus(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteDialogStatus} 
        onOpenChange={(open) => !open && setDeleteDialogStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogStatus?.is_default ? (
                "This is your default status. Deleting it will reset another status as default."
              ) : (
                "This action will delete the status and cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialogStatus && handleDelete(deleteDialogStatus)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
