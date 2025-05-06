
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyWorkspace } from '@/components/workspace/EmptyWorkspace';
import { Workspace } from '@/types/workspace';

const WorkspaceDashboard: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { getWorkspace, isLoading } = useWorkspaces();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) {
        setError("No workspace ID provided");
        return;
      }

      try {
        const data = await getWorkspace(workspaceId);
        if (!data) {
          setError("Workspace not found");
          return;
        }
        
        setWorkspace(data);
      } catch (err) {
        console.error("Error fetching workspace:", err);
        setError("Failed to load workspace details");
      }
    };

    fetchWorkspace();
  }, [workspaceId, getWorkspace]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
        </div>
      </AppShell>
    );
  }

  if (error || !workspace) {
    return (
      <AppShell>
        <div className="container max-w-4xl mx-auto py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <p>{error || "No workspace found"}</p>
            <button 
              onClick={() => navigate('/')} 
              className="mt-2 text-red-700 underline"
            >
              Return to Home
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <EmptyWorkspace workspaceName={workspace.name} />
    </AppShell>
  );
};

export default WorkspaceDashboard;
