
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useEmailSelection() {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Handle email selection with improved debugging
  const handleSelectEmail = useCallback((emailId: string) => {
    console.log('Selecting email with ID:', emailId);
    
    // First, set the selected email ID
    setSelectedEmail(emailId);
    
    // Force refetch conversation if needed
    if (emailId) {
      // Wait for next tick to ensure selectedEmail is updated
      setTimeout(() => {
        console.log('Triggering conversation refetch for email:', emailId);
        queryClient.invalidateQueries({ queryKey: ['conversation', emailId] });
      }, 0);
    }
  }, [queryClient]);
  
  return {
    selectedEmail,
    setSelectedEmail: handleSelectEmail
  };
}
