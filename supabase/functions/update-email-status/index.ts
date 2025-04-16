
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailSummary } from '../_shared/types.ts';

// Helper function to get emails from storage
async function getStoredEmails(): Promise<EmailSummary[]> {
  try {
    // In a real application, this would fetch from a database
    const kv = await Deno.openKv();
    const storedData = await kv.get(["mock_emails_storage"]);
    
    if (storedData.value) {
      console.log("Using stored emails from KV store");
      return storedData.value as EmailSummary[];
    } else {
      console.log("No stored emails found in KV store");
      return [];
    }
  } catch (error) {
    console.error("Error accessing email storage:", error);
    return []; 
  }
}

// Helper function to save emails to storage
async function saveEmails(emails: EmailSummary[]): Promise<void> {
  try {
    const kv = await Deno.openKv();
    await kv.set(["mock_emails_storage"], emails);
    console.log("Saved updated emails to KV store");
  } catch (error) {
    console.error("Error saving emails to storage:", error);
  }
}

const handler = async (req: Request) => {
  console.log("[update-email-status] Function called");
  
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
    const { emailId, status } = await req.json();
    
    if (!emailId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: emailId or status' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Get emails from storage
    let emails = await getStoredEmails();
    
    // Find and update the email
    const emailIndex = emails.findIndex(email => email.id === emailId);
    if (emailIndex === -1) {
      return new Response(
        JSON.stringify({ error: `Email with ID ${emailId} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Update the email status
    console.log(`Updating email ${emailId} status from ${emails[emailIndex].status} to ${status}`);
    emails[emailIndex].status = status as 'new' | 'in-progress' | 'resolved';
    
    // Save the updated emails back to storage
    await saveEmails(emails);
    
    // In a real app, we would update database records here
    console.log(`Email status updated successfully`);
    
    // Get updated emails
    const updatedEmailsResponse = {
      emails,
      totalCount: emails.length,
      newCount: emails.filter(e => !e.status || e.status === 'new').length
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedEmailsResponse,
        message: `Email status updated successfully to ${status}` 
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in update-email-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

Deno.serve(handler);
