import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateRoomRequest {
  meetingId: string;
  meetingTitle: string;
}

interface JoinRoomRequest {
  roomName: string;
  userName: string;
  userId: string;
  meetingId: string;
  isOwner?: boolean;
}

interface DeleteRoomRequest {
  roomName: string;
  meetingId: string;
}

// Input validation helpers
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function validateInput(params: {
  meetingId?: string;
  userName?: string;
  meetingTitle?: string;
  roomName?: string;
}): { valid: boolean; error?: string } {
  if (params.meetingId && !isValidUUID(params.meetingId)) {
    return { valid: false, error: "Invalid meeting ID format" };
  }
  if (params.userName && params.userName.length > 100) {
    return { valid: false, error: "Username too long (max 100 characters)" };
  }
  if (params.meetingTitle && params.meetingTitle.length > 200) {
    return { valid: false, error: "Meeting title too long (max 200 characters)" };
  }
  if (params.roomName && params.roomName.length > 100) {
    return { valid: false, error: "Room name too long (max 100 characters)" };
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

  const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
  if (!DAILY_API_KEY) {
    console.error("DAILY_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "Daily.co API key not configured" }),
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

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (path === "create" && req.method === "POST") {
      const { meetingId, meetingTitle } = (await req.json()) as CreateRoomRequest;

      // Validate input
      const validation = validateInput({ meetingId, meetingTitle });
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user is the meeting host
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .select("host_id")
        .eq("id", meetingId)
        .single();

      if (meetingError || !meeting) {
        console.error("Meeting not found:", meetingId);
        return new Response(
          JSON.stringify({ error: "Meeting not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (meeting.host_id !== user.id) {
        console.error("User is not the meeting host:", user.id);
        return new Response(
          JSON.stringify({ error: "Only the meeting host can create rooms" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const roomName = `cortexa-${meetingId.slice(0, 8)}`;

      const response = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
            max_participants: 20,
            exp: Math.floor(Date.now() / 1000) + 86400,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const getResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
            headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
          });

          if (getResponse.ok) {
            const room = await getResponse.json();
            console.log("Room already exists:", roomName);
            return new Response(JSON.stringify({ room }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        const error = await response.text();
        console.error("Failed to create room:", error);
        throw new Error(`Failed to create room: ${error}`);
      }

      const room = await response.json();
      console.log("Room created by user:", user.id, "room:", room.name);

      return new Response(JSON.stringify({ room }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "token" && req.method === "POST") {
      const { roomName, userName, userId, meetingId, isOwner } = (await req.json()) as JoinRoomRequest;

      // Validate input
      const validation = validateInput({ meetingId, userName, roomName });
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user is a meeting participant or host
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
          console.error("User is not a meeting participant:", user.id);
          return new Response(
            JSON.stringify({ error: "You must be a meeting participant to join" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const response = await fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: userName.slice(0, 100), // Ensure max length
            user_id: userId,
            is_owner: isOwner || false,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: true,
            exp: Math.floor(Date.now() / 1000) + 86400,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to create token:", error);
        throw new Error(`Failed to create meeting token: ${error}`);
      }

      const { token } = await response.json();
      console.log("Token created for user:", user.id, "userName:", userName);

      return new Response(JSON.stringify({ token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "delete" && req.method === "POST") {
      const { roomName, meetingId } = (await req.json()) as DeleteRoomRequest;

      // Validate input
      const validation = validateInput({ meetingId, roomName });
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user is the meeting host
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .select("host_id")
        .eq("id", meetingId)
        .single();

      if (meetingError || !meeting) {
        console.error("Meeting not found:", meetingId);
        return new Response(
          JSON.stringify({ error: "Meeting not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (meeting.host_id !== user.id) {
        console.error("User is not the meeting host:", user.id);
        return new Response(
          JSON.stringify({ error: "Only the meeting host can delete rooms" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        console.error("Failed to delete room:", error);
      }

      console.log("Room deleted by user:", user.id, "room:", roomName);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown endpoint" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in daily-rooms function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
