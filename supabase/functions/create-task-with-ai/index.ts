import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import OpenAI from "https://esm.sh/openai@4.28.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      });
    }

    const supabaseUserClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      });
    }

    const { title, description } = await req.json();

    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: "Missing title or description" }),
        {
          status: 400,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const prompt = `Based on this task title: "${title}" and description: "${description}", suggest ONE of these labels: work, personal, priority, shopping, home. Reply with just the label word.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 16,
    });

    const suggestedLabel = completion.choices[0].message.content
      ?.toLowerCase()
      .trim();

    const validLabels = ["work", "personal", "priority", "shopping", "home"];
    const label = validLabels.includes(suggestedLabel || "")
      ? suggestedLabel
      : null;

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: newTask, error: insertError } = await supabaseAdmin
      .from("tasks")
      .insert([
        {
          title,
          description,
          completed: false,
          user_id: user.id,
          label,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify(newTask), {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    console.error("Error in create-task-with-ai:", err);

    return new Response(
      JSON.stringify({
        error: err.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
  }
});