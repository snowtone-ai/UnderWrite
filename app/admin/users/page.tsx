import { getServiceClient } from "@/lib/supabase/server";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const db = getServiceClient();
  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const { data: profiles } = await db.from("profiles").select("id, role");

  const roleMap = new Map((profiles ?? []).map((p) => [p.id, p.role as string]));

  const users = (authData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    role: (roleMap.get(u.id) ?? "member") as "admin" | "member",
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at ?? null,
    banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">ユーザー管理</h1>
      <UsersTable users={users} />
    </main>
  );
}
