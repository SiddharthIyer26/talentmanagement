// Supabase Edge Function: admin-manage-credentials
// Enterprise Credential Provisioning & Authentication Management
// Uses official Supabase Auth Admin API (supabase.auth.admin) server-side only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestPayload {
  action: "provision_management_user" | "provision_influencer" | "reset_password" | "update_email";
  email: string;
  password?: string;
  newPassword?: string;
  role?: "ADMIN" | "INFLUENCER";
  // Management user specific
  name?: string;
  username?: string;
  phone?: string;
  managementRole?: "Owner" | "Partner" | "Talent Manager";
  managementId?: string;
  // Influencer specific
  handle?: string;
  city?: string;
  pan?: string;
  invoicePrefix?: string;
  influencerId?: string;
  bankDetails?: any;
  rateCard?: any;
  // Email update specific
  newEmail?: string;
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate caller authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized: Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user: callerUser },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized: Invalid session token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Initialize server-side service-role admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Verify administrator authorization
    // Required authorization:
    // - Owner = authorized
    // - Admin = authorized if this role exists
    // - Partner = NOT authorized
    // - Talent Manager = NOT authorized
    // - Influencer = NOT authorized
    const callerEmail = (callerUser.email || "").toLowerCase().trim();
    if (!callerEmail) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized: Missing caller email." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4.1: Verify JWT claims — Influencers are strictly blocked
    const callerJwtRole = (callerUser.app_metadata?.role || callerUser.user_metadata?.role || "").toUpperCase();
    if (callerJwtRole === "INFLUENCER") {
      return new Response(
        JSON.stringify({ success: false, message: "Forbidden: Influencer accounts cannot manage credentials." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isAuthorizedAdmin = false;

    // Step 4.2: Query caller's profile in management_users using server-side service-role adminClient
    let callerMgmt: any = null;

    const { data: mgmtByEmail, error: emailErr } = await adminClient
      .from("management_users")
      .select("id, role, account_status, email")
      .ilike("email", callerEmail)
      .limit(1);

    if (!emailErr && mgmtByEmail && mgmtByEmail.length > 0) {
      callerMgmt = mgmtByEmail[0];
    } else {
      const { data: mgmtById, error: idErr } = await adminClient
        .from("management_users")
        .select("id, role, account_status, email")
        .eq("id", callerUser.id)
        .limit(1);

      if (!idErr && mgmtById && mgmtById.length > 0) {
        callerMgmt = mgmtById[0];
      }
    }

    if (callerMgmt) {
      // 1. Must be active (account_status must not be 'disabled')
      const rawStatus = (callerMgmt.account_status || "active").trim().toLowerCase();
      const isActive = rawStatus === "active";

      // 2. Role matching must be case-insensitive and safely handle "Owner"/"OWNER"/"Admin"/"ADMIN"/"Administrator".
      // Partner, Talent Manager, Influencer or other roles remain explicitly forbidden.
      const rawRole = (callerMgmt.role || "").trim().toLowerCase();
      const isAllowedAdminRole = rawRole === "owner" || rawRole === "admin" || rawRole === "administrator";

      if (isActive && isAllowedAdminRole) {
        isAuthorizedAdmin = true;
      }
    }

    // Step 4.3: Ensure authenticated primary Owner (siddharthiyer.work@gmail.com) and Admin (admin@iyer.tech) are recognized if active
    if (!isAuthorizedAdmin && (callerEmail === "siddharthiyer.work@gmail.com" || callerEmail === "admin@iyer.tech")) {
      const rawStatus = (callerMgmt?.account_status || "active").trim().toLowerCase();
      if (rawStatus !== "disabled") {
        isAuthorizedAdmin = true;
      }
    }

    // Safe bootstrap check: ONLY if management_users table is completely empty,
    // allow initial authenticated admin user to bootstrap credentials
    if (!isAuthorizedAdmin) {
      const { count } = await adminClient
        .from("management_users")
        .select("*", { count: "exact", head: true });

      if (count === 0 && (callerEmail === "siddharthiyer.work@gmail.com" || callerEmail === "admin@iyer.tech")) {
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Forbidden: Only an active Owner or Administrator can manage system credentials.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Parse request payload
    const body: RequestPayload = await req.json();
    const action = body.action;
    const targetEmail = (body.email || "").toLowerCase().trim();

    if (!targetEmail || !targetEmail.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, message: "A valid email address is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper to find existing Auth user by email
    const findAuthUserByEmail = async (email: string) => {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      return data.users.find((u) => u.email?.toLowerCase().trim() === email);
    };

    // ACTION A: Provision / Update Management User
    if (action === "provision_management_user") {
      const name = (body.name || "").trim() || targetEmail.split("@")[0];
      const username = (body.username || "").trim() || targetEmail.split("@")[0];
      const password = body.password?.trim();
      const phone = body.phone?.trim() || "";
      const managementRole = body.managementRole || "Partner";

      // 1. Locate or determine existing profile in management_users
      // If targetEmail is NOT Siddharth's personal email, ensure we NEVER match mgmt-1
      let existingMgmt: any = null;
      const { data: byEmail } = await adminClient
        .from("management_users")
        .select("*")
        .ilike("email", targetEmail)
        .limit(1);

      if (byEmail && byEmail.length > 0) {
        existingMgmt = byEmail[0];
      } else if (body.managementId && (targetEmail === "siddharthiyer.work@gmail.com" || body.managementId !== "mgmt-1")) {
        const { data: byId } = await adminClient
          .from("management_users")
          .select("*")
          .eq("id", body.managementId)
          .limit(1);
        if (byId && byId.length > 0) existingMgmt = byId[0];
      }

      const targetProfileId = existingMgmt?.id || body.managementId || (targetEmail === "admin@iyer.tech" ? "mgmt-admin" : "mgmt-" + Date.now());

      // 2. Manage Auth account via Supabase Auth Admin API
      const existingAuthUser = await findAuthUserByEmail(targetEmail);
      let authUserId: string;

      if (existingAuthUser) {
        authUserId = existingAuthUser.id;
        const updateParams: any = {
          email: targetEmail,
          email_confirm: true,
          user_metadata: {
            ...existingAuthUser.user_metadata,
            name,
            username,
            role: "ADMIN",
          },
          app_metadata: {
            ...existingAuthUser.app_metadata,
            provider: "email",
            providers: ["email"],
            role: "ADMIN",
          },
        };
        if (password && password.length >= 6) {
          updateParams.password = password;
        }

        const { error: updateErr } = await adminClient.auth.admin.updateUserById(authUserId, updateParams);
        if (updateErr) throw updateErr;
      } else {
        if (!password || password.length < 6) {
          return new Response(
            JSON.stringify({ success: false, message: "Password must be at least 6 characters for a new account." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: newAuth, error: createErr } = await adminClient.auth.admin.createUser({
          email: targetEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            name,
            username,
            role: "ADMIN",
          },
          app_metadata: {
            provider: "email",
            providers: ["email"],
            role: "ADMIN",
          },
        });
        if (createErr) throw createErr;
        authUserId = newAuth.user.id;
      }

      // 3. Upsert management_users profile (Plaintext password is NEVER stored)
      if (existingMgmt) {
        console.log("[DIAGNOSTIC EdgeFunction] Updating existing management user in public.management_users");
        const { error: dbErr } = await adminClient
          .from("management_users")
          .update({
            email: targetEmail,
            name,
            phone: phone || existingMgmt.phone,
            username,
            role: managementRole,
            account_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingMgmt.id);
        if (dbErr) {
          console.error("[DIAGNOSTIC EdgeFunction] Error updating management_users:", dbErr.message);
          throw new Error(`[Origin:EdgeFunction-Update-management_users, Code:${dbErr.code || 'UNKNOWN'}] ${dbErr.message}`);
        }
      } else {
        console.log("[DIAGNOSTIC EdgeFunction] Upserting new management user in public.management_users");
        const { error: dbErr } = await adminClient.from("management_users").upsert({
          id: targetProfileId,
          name,
          email: targetEmail,
          phone: phone || null,
          username,
          password: null,
          role: managementRole,
          account_status: "active",
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });
        if (dbErr) {
          console.error("[DIAGNOSTIC EdgeFunction] Error upserting management_users:", dbErr.message);
          throw new Error(`[Origin:EdgeFunction-Upsert-management_users, Code:${dbErr.code || 'UNKNOWN'}] ${dbErr.message}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Management profile for "${name}" successfully provisioned.`,
          profileId: targetProfileId,
          authUserId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION B: Provision / Update Influencer
    if (action === "provision_influencer") {
      const name = (body.name || "").trim() || targetEmail.split("@")[0];
      const rawHandle = (body.handle || "").trim() || targetEmail.split("@")[0];
      const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
      const username = (body.username || "").trim() || rawHandle.replace(/^@/, "");
      const password = body.password?.trim();
      const city = body.city?.trim() || "India";
      const phone = body.phone?.trim() || "+91 98000 00000";
      const pan = body.pan?.trim().toUpperCase() || "ABCDE1234F";
      const autoPrefix = (body.invoicePrefix?.trim() || name.slice(0, 2)).toUpperCase();

      // 1. Locate or determine existing profile in influencers to preserve ID & relations
      const { data: existingInf } = await adminClient
        .from("influencers")
        .select("*")
        .or(`email.ilike.${targetEmail},id.eq.${body.influencerId || "NONE"},handle.ilike.${handle},username.ilike.${username}`)
        .maybeSingle();

      const targetProfileId = existingInf?.id || body.influencerId || "inf-" + Date.now();

      // 2. Manage Auth account via Supabase Auth Admin API
      const existingAuthUser = await findAuthUserByEmail(targetEmail);
      let authUserId: string;

      if (existingAuthUser) {
        authUserId = existingAuthUser.id;
        const updateParams: any = {
          email: targetEmail,
          email_confirm: true,
          user_metadata: {
            ...existingAuthUser.user_metadata,
            name,
            handle,
            username,
            role: "INFLUENCER",
            influencer_id: targetProfileId,
          },
          app_metadata: {
            ...existingAuthUser.app_metadata,
            provider: "email",
            providers: ["email"],
            role: "INFLUENCER",
          },
        };
        if (password && password.length >= 6) {
          updateParams.password = password;
        }

        const { error: updateErr } = await adminClient.auth.admin.updateUserById(authUserId, updateParams);
        if (updateErr) throw updateErr;
      } else {
        if (!password || password.length < 6) {
          return new Response(
            JSON.stringify({ success: false, message: "Password must be at least 6 characters for a new account." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: newAuth, error: createErr } = await adminClient.auth.admin.createUser({
          email: targetEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            name,
            handle,
            username,
            role: "INFLUENCER",
            influencer_id: targetProfileId,
          },
          app_metadata: {
            provider: "email",
            providers: ["email"],
            role: "INFLUENCER",
          },
        });
        if (createErr) throw createErr;
        authUserId = newAuth.user.id;
      }

      // 3. Upsert influencers profile (Plaintext password is NEVER stored)
      if (existingInf) {
        const { error: dbErr } = await adminClient
          .from("influencers")
          .update({
            email: targetEmail,
            name,
            handle,
            city: city || existingInf.city,
            phone: phone || existingInf.phone,
            username,
            account_status: "active",
            bank_details: body.bankDetails || existingInf.bank_details,
            rate_card: body.rateCard || existingInf.rate_card,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingInf.id);
        if (dbErr) throw dbErr;
      } else {
        const { error: dbErr } = await adminClient.from("influencers").insert({
          id: targetProfileId,
          name,
          handle,
          city,
          email: targetEmail,
          phone,
          pan,
          username,
          password: null,
          account_status: "active",
          bank_details: body.bankDetails || {},
          rate_card: body.rateCard || {},
          invoice_prefix: autoPrefix,
        });
        if (dbErr) throw dbErr;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Influencer profile for "${name}" successfully provisioned.`,
          profileId: targetProfileId,
          authUserId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION C: Reset / Update User Password
    if (action === "reset_password") {
      const newPassword = (body.newPassword || body.password || "").trim();
      if (!newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ success: false, message: "Password must be at least 6 characters long." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const targetRole = body.role || "ADMIN";
      const influencerId = body.influencerId;

      const existingAuthUser = await findAuthUserByEmail(targetEmail);

      if (existingAuthUser) {
        const updateParams: any = {
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            ...existingAuthUser.user_metadata,
            role: targetRole,
            ...(targetRole === "INFLUENCER" && influencerId ? { influencer_id: influencerId } : {}),
          },
          app_metadata: {
            ...existingAuthUser.app_metadata,
            role: targetRole,
          },
        };
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, updateParams);
        if (updateErr) throw updateErr;
      } else {
        const username = targetEmail === "admin@iyer.tech" ? "admin" : targetEmail.split("@")[0];
        const name = targetEmail === "admin@iyer.tech" ? "System Administrator" : targetEmail.split("@")[0];

        const { error: createErr } = await adminClient.auth.admin.createUser({
          email: targetEmail,
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            name,
            username,
            role: targetRole,
            ...(targetRole === "INFLUENCER" && influencerId ? { influencer_id: influencerId } : {}),
          },
          app_metadata: {
            provider: "email",
            providers: ["email"],
            role: targetRole,
          },
        });
        if (createErr) throw createErr;
      }

      // Also ensure public.management_users profile exists and is active for the admin user
      if (targetRole === "ADMIN") {
        const { data: existingMgmt } = await adminClient
          .from("management_users")
          .select("id")
          .ilike("email", targetEmail)
          .limit(1);

        if (!existingMgmt || existingMgmt.length === 0) {
          const profileId = targetEmail === "admin@iyer.tech" ? "mgmt-admin" : "mgmt-" + Date.now();
          const username = targetEmail === "admin@iyer.tech" ? "admin" : targetEmail.split("@")[0];
          const name = targetEmail === "admin@iyer.tech" ? "System Administrator" : targetEmail.split("@")[0];

          await adminClient.from("management_users").upsert({
            id: profileId,
            name: name,
            email: targetEmail,
            phone: "+91 98765 43211",
            username: username,
            password: null,
            role: "Owner",
            account_status: "active",
            updated_at: new Date().toISOString()
          }, { onConflict: "id" });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Password successfully updated in Supabase Auth for ${targetEmail}.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION D: Update User Email
    if (action === "update_email") {
      const newEmail = (body.newEmail || "").toLowerCase().trim();
      if (!newEmail || !newEmail.includes("@")) {
        return new Response(
          JSON.stringify({ success: false, message: "A valid new email address is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const existingAuthUser = await findAuthUserByEmail(targetEmail);
      if (existingAuthUser) {
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
          email: newEmail,
          email_confirm: true,
        });
        if (updateErr) throw updateErr;
      }

      if (body.role === "ADMIN") {
        await adminClient.from("management_users").update({ email: newEmail }).ilike("email", targetEmail);
      } else if (body.role === "INFLUENCER") {
        await adminClient.from("influencers").update({ email: newEmail }).ilike("email", targetEmail);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Email updated from ${targetEmail} to ${newEmail}.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: `Unknown action: "${action}".` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err?.message || "Internal server error occurred in admin-manage-credentials.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
