
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const handler = async (req: Request) => {
  console.log("[mark-as-read] Handler function started");
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log("[mark-as-read] Handling OPTIONS request with CORS headers");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[mark-as-read] No authorization header provided");
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
    const requestData = await req.json();
    const { emailId } = requestData;
    
    console.log(`[mark-as-read] Request received with data:`, JSON.stringify(requestData, null, 2));
    
    if (!emailId) {
      console.error("[mark-as-read] No email ID provided in request body");
      return new Response(
        JSON.stringify({ error: 'No email ID provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`[mark-as-read] Marking email ${emailId} as read`);
    
    // First get the current state of the emails to ensure we have the most up-to-date data
    const { data: currentData, error: fetchError } = await supabase.functions.invoke('fetch-emails', {
      body: {}
    });
    
    if (fetchError) {
      console.error('[mark-as-read] Error getting current emails state:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Now call the fetch-emails function with markAsReadId parameter to update the email status
    const invokeResponse = await supabase.functions.invoke('fetch-emails', {
      body: {
        markAsReadId: emailId
      }
    });
    
    if (invokeResponse.error) {
      console.error('[mark-as-read] Error calling fetch-emails:', invokeResponse.error);
      return new Response(
        JSON.stringify({ error: invokeResponse.error }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Verify the email was actually marked as read
    const markedEmail = invokeResponse.data.emails.find((email: any) => email.id === emailId);
    if (!markedEmail || !markedEmail.read) {
      console.error(`[mark-as-read] Failed to update read status for email ${emailId}`);
      return new Response(
        JSON.stringify({ error: 'Failed to update read status' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    console.log(`[mark-as-read] Response from fetch-emails:`, JSON.stringify(invokeResponse.data, null, 2));
    console.log(`[mark-as-read] Email ${emailId} marked as read successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId,
        message: 'Email marked as read successfully',
        data: invokeResponse.data 
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('[mark-as-read] Uncaught error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

Deno.serve(handler);
