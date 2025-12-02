import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase credentials not found. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables to use Supabase storage."
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to create authenticated Supabase client
export function createAuthenticatedClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// Test database connection
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.log("📦 Database: Using in-memory storage (Supabase not configured)");
    return false;
  }

  try {
    // Simple query to test connection - try to select from a table
    // We'll try text_content first, but if tables don't exist yet, we'll catch that
    const { data, error } = await supabase
      .from("text_content")
      .select("id")
      .limit(1);

    // If we get an error about table not existing, that's still a connection success
    // We just need to verify we can reach Supabase
    if (error) {
      // Check if it's a table not found error (which means connection works but schema not set up)
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        console.log("✅ Database: Connected to Supabase (tables not created yet - run supabase-schema.sql)");
        return true;
      }
      // Other errors might indicate connection issues
      console.error("❌ Database: Supabase connection test failed:", error.message);
      return false;
    }

    // Success - we got data or empty result, connection works
    console.log("✅ Database: Connected to Supabase and pingable");
    return true;
  } catch (error: any) {
    console.error("❌ Database: Supabase connection test failed:", error.message || error);
    return false;
  }
}

// Database table types
export interface Database {
  public: {
    Tables: {
      text_content: {
        Row: {
          id: string;
          key: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          author_id: string;
          published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          tags: string[] | null;
          featured_image: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content: string;
          excerpt?: string | null;
          author_id: string;
          published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[] | null;
          featured_image?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string;
          excerpt?: string | null;
          author_id?: string;
          published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[] | null;
          featured_image?: string | null;
        };
      };
      page_configs: {
        Row: {
          id: string;
          page_key: string;
          title: string;
          description: string | null;
          config: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_key: string;
          title: string;
          description?: string | null;
          config: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_key?: string;
          title?: string;
          description?: string | null;
          config?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

