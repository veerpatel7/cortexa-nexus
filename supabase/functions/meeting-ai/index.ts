import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeRequest {
  action: "summarize" | "decisions" | "actions" | "transcribe";
  transcript: string;
  meetingId: string;
  context?: string;
}

const VALID_ACTIONS = ["summarize", "decisions", "actions", "transcribe"];
const MAX_TRANSCRIPT_LENGTH = 50000; // 50KB max
const MAX_CONTEXT_LENGTH = 1000;

// Input validation
function validateInput(params: {
  action?: string;
  transcript?: string;
  meetingId?: string;
  context?: string;
}): { valid: boolean; error?: string } {
  if (params.action && !VALID_ACTIONS.includes(params.action)) {
    return { valid: false, error: "Invalid action. Must be one of: summarize, decisions, actions, transcribe" };
  }
  if (params.meetingId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.meetingId)) {
    return { valid: false, error: "Invalid meeting ID format" };
  }
  if (params.transcript && params.transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return { valid: false, error: `Transcript too long (max ${MAX_TRANSCRIPT_LENGTH} characters)` };
  }
  if (params.context && params.context.length > MAX_CONTEXT_LENGTH) {
    return { valid: false, error: `Context too long (max ${MAX_CONTEXT_LENGTH} characters)` };
  }
  if (!params.transcript || params.transcript.trim().length === 0) {
    return { valid: false, error: "Transcript is required" };
  }
  return { valid: true };
}

// Authentication helper
async function authenticateRequest(req: Request): Promise<{
  user: { id: string } | null;
  supabase: ReturnType<typeof createClient>;
  error?: string;
}> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, supabase: null as any, error: "Missing or invalid authorization header" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return { user: null, supabase, error: "Invalid or expired token" };
  }

  return { user: data.user, supabase, error: undefined };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "AI API key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Authenticate the request
    const { user, supabase, error: authError } = await authenticateRequest(req);
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: authError || "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, transcript, meetingId, context } = (await req.json()) as AnalyzeRequest;

    // Validate input
    const validation = validateInput({ action, transcript, meetingId, context });
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this meeting (is host or participant)
    const { data: meeting } = await supabase
      .from("meetings")
      .select("host_id")
      .eq("id", meetingId)
      .single();

    const isHost = meeting?.host_id === user.id;

    if (!isHost) {
      const { data: participant } = await supabase
        .from("meeting_participants")
        .select("id")
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .single();

      if (!participant) {
        console.error("User does not have access to meeting:", user.id, meetingId);
        return new Response(
          JSON.stringify({ error: "You do not have access to this meeting" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Sanitize transcript for prompt injection prevention
    const sanitizedTranscript = transcript.replace(/```/g, "'''");
    const sanitizedContext = context?.replace(/```/g, "'''") || "";

    switch (action) {
      case "summarize":
        systemPrompt = `You are Nova AI, an intelligent meeting assistant. You provide concise, actionable summaries of meeting discussions. Focus on key points, decisions made, and next steps. Be professional but conversational.`;
        userPrompt = `Summarize the following meeting transcript in 3-5 bullet points:\n\n${sanitizedTranscript}`;
        break;

      case "decisions":
        systemPrompt = `You are Nova AI, specialized in extracting decisions from meetings. Identify clear decisions, who owns them, and their status (proposed, confirmed, or deferred).`;
        userPrompt = `Extract all decisions from this meeting transcript. For each decision, provide:
- Content: The decision made
- Owner: Who is responsible
- Status: proposed/confirmed/deferred

Transcript:\n${sanitizedTranscript}

${sanitizedContext ? `Context: ${sanitizedContext}` : ""}

Return as JSON array: [{"content": "...", "owner": "...", "status": "..."}]`;
        break;

      case "actions":
        systemPrompt = `You are Nova AI, specialized in extracting action items from meetings. Identify tasks, assignees, priorities, and deadlines.`;
        userPrompt = `Extract all action items from this meeting transcript. For each action:
- Task: What needs to be done
- Assignee: Who is responsible
- Priority: low/medium/high
- Deadline: If mentioned (ISO date format or null)

Transcript:\n${sanitizedTranscript}

${sanitizedContext ? `Context: ${sanitizedContext}` : ""}

Return as JSON array: [{"task": "...", "assignee": "...", "priority": "...", "deadline": null}]`;
        break;

      case "transcribe":
        systemPrompt = `You are Nova AI. Clean up and format the provided speech-to-text transcription. Fix grammar, punctuation, and speaker attribution where possible. Maintain the original meaning.`;
        userPrompt = `Clean up this transcription:\n\n${sanitizedTranscript}`;
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON responses for decisions and actions
    let result: any = content;
    if (action === "decisions" || action === "actions") {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse AI response as JSON:", e);
        result = [];
      }
    }

    console.log(`AI ${action} completed for user:`, user.id, "meeting:", meetingId);
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in meeting-ai function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
