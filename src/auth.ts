import { Elysia, t } from "elysia";
import { supabase } from "./supabase";

export const authPlugin = new Elysia({ name: "auth" })
  .post(
    "/auth/login",
    async ({ body, set }) => {
      if (!supabase) {
        set.status = 503;
        return {
          error:
            "Authentication service not available. Supabase not configured.",
        };
      }

      const { email, password } = body;

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        set.status = 401;
        return {
          error: "Invalid email or password",
        };
      }

      return {
        message: "Login successful",
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          ...data.user.user_metadata,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
      detail: {
        summary: "Login with Supabase Auth",
        tags: ["Auth"],
      },
    }
  )
  .post(
    "/auth/refresh",
    async ({ body, set }) => {
      if (!supabase) {
        set.status = 503;
        return {
          error:
            "Authentication service not available. Supabase not configured.",
        };
      }

      const { refreshToken } = body;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        set.status = 401;
        return {
          error: "Invalid refresh token",
        };
      }

      return {
        message: "Token refreshed successfully",
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
      detail: {
        summary: "Refresh access token",
        tags: ["Auth"],
      },
    }
  )
  .post(
    "/auth/logout",
    async ({ headers, set }) => {
      if (!supabase) {
        set.status = 503;
        return {
          error:
            "Authentication service not available. Supabase not configured.",
        };
      }

      const authHeader = (headers as Record<string, string | undefined>)
        .authorization;
      if (!authHeader || typeof authHeader !== "string") {
        set.status = 401;
        return {
          error: "Authorization header required",
        };
      }

      const token = authHeader.replace(/^Bearer /i, "").trim();

      // Create a client with the user's token to sign them out
      const { error } = await supabase.auth.signOut();

      if (error) {
        set.status = 400;
        return {
          error: error.message,
        };
      }

      return {
        message: "Logout successful",
      };
    },
    {
      detail: {
        summary: "Logout user",
        tags: ["Auth"],
      },
    }
  );

// Reusable authentication guard
export const requireAuth = async (context: any) => {
  const { user, set, headers } = context;

  // If user is already set from derive, use it
  if (user) {
    return;
  }

  // Otherwise, verify Supabase token
  if (!supabase) {
    if (set) {
      set.status = 503;
    }
    return {
      error: "Authentication service not available. Supabase not configured.",
    };
  }

  if (!headers) {
    if (set) {
      set.status = 401;
    }
    return {
      error:
        "Unauthorized. Please provide a valid Supabase JWT token in the Authorization header.",
    };
  }

  const authHeader = (headers as Record<string, string | undefined>)
    .authorization;
  if (!authHeader || typeof authHeader !== "string") {
    if (set) {
      set.status = 401;
    }
    return {
      error:
        "Unauthorized. Please provide a valid Supabase JWT token in the Authorization header.",
    };
  }

  const normalizedHeader = authHeader.trim();
  const bearerPrefix = normalizedHeader.substring(0, 7).toLowerCase();
  if (bearerPrefix !== "bearer ") {
    if (set) {
      set.status = 401;
    }
    return {
      error:
        "Unauthorized. Please provide a valid Supabase JWT token in the Authorization header.",
    };
  }

  const token = normalizedHeader.substring(7).trim();
  if (!token) {
    if (set) {
      set.status = 401;
    }
    return {
      error:
        "Unauthorized. Please provide a valid Supabase JWT token in the Authorization header.",
    };
  }

  // Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    if (set) {
      set.status = 401;
    }
    return {
      error: "Unauthorized. Invalid or expired token.",
    };
  }

  // Token is valid, allow request to proceed
  return;
};
