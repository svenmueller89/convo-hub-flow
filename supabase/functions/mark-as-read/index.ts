
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const handler = async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
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
    
    // Call the fetch-emails function with markAsReadId parameter 
    // This will update the email status in our mock data
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
    
    console.log(`[mark-as-read] Response from fetch-emails:`, JSON.stringify(invokeResponse.data, null, 2));
    
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
