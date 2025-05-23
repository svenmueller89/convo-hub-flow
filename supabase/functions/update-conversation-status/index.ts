
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const handler = async (req: Request) => {
  console.log("[update-conversation-status] Function called");
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase client with the user's JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fmcymhdtudjohlabpvob.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Parse request data
    const { conversationId, statusId } = await req.json();
    
    if (!conversationId || !statusId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: conversationId or statusId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Get the corresponding status
    const { data: statusData, error: statusError } = await supabase
      .from('conversation_statuses')
      .select('*')
      .eq('id', statusId)
      .single();
      
    if (statusError) {
      return new Response(
        JSON.stringify({ error: `Status not found: ${statusError.message}` }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    console.log(`Updating conversation ${conversationId} to status: ${statusData.name}`);
    
    // Update the status in the email update endpoint
    const response = await supabase.functions.invoke('update-email-status', {
      body: { 
        emailId: null,
        conversationId: conversationId,
        status: statusData.name.toLowerCase().replace(' ', '-')
      }
    });
    
    if (response.error) {
      console.error('Error from update-email-status:', response.error);
      return new Response(
        JSON.stringify({ error: `Failed to update status: ${response.error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Force a delay to ensure the status is updated before the client refreshes
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: response.data,
        message: `Conversation status updated successfully to ${statusData.name}` 
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in update-conversation-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

Deno.serve(handler);
