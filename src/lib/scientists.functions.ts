import { createServerFn } from "@tanstack/react-start";

type Payload = { accessToken: string; action: "create" | "update" | "delete"; [k: string]: unknown };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const manageScientist = createServerFn({ method: "POST" })
  .inputValidator((input: Payload) => input)
  .handler(async ({ data: body }) => {
    try {
      const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
      const { data: userRes, error: userErr } = await admin.auth.getUser(body.accessToken);
      if (userErr || !userRes.user) return { error: "Unauthorized" };
      const callerId = userRes.user.id;

      const [{ data: prof }, { data: roles }] = await Promise.all([
        admin.from("profiles").select("role, active").eq("user_id", callerId).maybeSingle(),
        admin.from("user_roles").select("role").eq("user_id", callerId),
      ]);
      const isAdmin = (roles ?? []).some((r) => r.role === "lab_admin");
      const isSenior = prof?.active !== false && (prof?.role ?? "").toLowerCase().includes("senior");
      if (!isAdmin && !isSenior) return { error: "Forbidden — Senior Scientist only" };

      const findUser = async (email: string) => {
        if (!email) return null;
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) throw error;
        return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
      };
      const syncProfile = async (userId: string, name: string, role: string, active: boolean) => {
        const { data: ex } = await admin.from("profiles").select("id").eq("user_id", userId).maybeSingle();
        const row = { display_name: name, role, active };
        const { error } = ex
          ? await admin.from("profiles").update(row).eq("user_id", userId)
          : await admin.from("profiles").insert({ user_id: userId, ...row });
        if (error) throw error;
      };

      if (body.action === "create") {
        const name = text(body.name), email = text(body.email).toLowerCase(), password = text(body.password);
        const role = text(body.role) || "Lab Scientist";
        if (!name || !email || !password) return { error: "name, email, password required" };
        let user = await findUser(email);
        if (user) {
          const r = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { ...(user.user_metadata ?? {}), full_name: name } });
          if (r.error) throw r.error;
        } else {
          const r = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
          if (r.error) throw r.error;
          user = r.data.user;
        }
        if (!user) return { error: "Unable to create login" };
        await syncProfile(user.id, name, role, true);
        const { data: ex } = await admin.from("scientists").select("id").ilike("email", email).maybeSingle();
        const row = { name, email, role, active: true };
        const r = ex
          ? await admin.from("scientists").update(row).eq("id", ex.id).select().single()
          : await admin.from("scientists").insert(row).select().single();
        if (r.error) throw r.error;
        return { scientist: r.data, user_id: user.id };
      }

      if (body.action === "update") {
        const id = text(body.id);
        if (!id) return { error: "id required" };
        const name = text(body.name), email = text(body.email).toLowerCase(), password = text(body.password);
        const role = text(body.role) || "Lab Scientist";
        const active = body.active !== false;
        const { data: cur } = await admin.from("scientists").select("email").eq("id", id).maybeSingle();
        const r = await admin.from("scientists").update({ name, email, role, active }).eq("id", id).select().single();
        if (r.error) throw r.error;
        const target = (await findUser(cur?.email ?? "")) ?? (await findUser(email));
        if (target) {
          const u = await admin.auth.admin.updateUserById(target.id, {
            ...(email ? { email } : {}),
            ...(password ? { password } : {}),
            ...(name ? { user_metadata: { ...(target.user_metadata ?? {}), full_name: name } } : {}),
          });
          if (u.error) throw u.error;
          await syncProfile(target.id, name, role, active);
        }
        return { scientist: r.data };
      }

      if (body.action === "delete") {
        const id = text(body.id);
        if (!id) return { error: "id required" };
        const { data: sci } = await admin.from("scientists").select("email").eq("id", id).maybeSingle();
        await admin.from("scientists").update({ active: false }).eq("id", id);
        const target = await findUser(sci?.email ?? "");
        if (target && target.id !== callerId) await admin.auth.admin.deleteUser(target.id);
        return { ok: true };
      }
      return { error: "Unknown action" };
    } catch (e) {
      console.error("manageScientist", e);
      return { error: (e as Error).message };
    }
  });
