"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  role: "admin" | "member";
  createdAt: string;
  lastSignIn: string | null;
  banned: boolean;
};

export function UsersTable({ users: initial }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function invite() {
    setInviteError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    if (res.ok) {
      setInviteEmail("");
      startTransition(() => router.refresh());
    } else {
      const j = await res.json();
      setInviteError(j.error ?? "招待に失敗しました");
    }
  }

  async function setRole(userId: string, role: "admin" | "member") {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`${email} を削除しますか？この操作は元に戻せません。`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="招待するメールアドレス"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && invite()}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={invite} disabled={!inviteEmail || isPending} size="sm">
          招待
        </Button>
      </div>
      {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}

      <div className="divide-y divide-border rounded-lg border border-border">
        {users.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            ユーザーがいません
          </p>
        )}
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.email}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString("ja-JP")}
                {u.lastSignIn && (
                  <span>
                    {" "}· 最終ログイン {new Date(u.lastSignIn).toLocaleDateString("ja-JP")}
                  </span>
                )}
              </p>
            </div>
            <RoleBadge role={u.role} />
            <select
              value={u.role}
              onChange={(e) => setRole(u.id, e.target.value as "admin" | "member")}
              className="rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none"
              aria-label="ロール変更"
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <button
              onClick={() => deleteUser(u.id, u.email)}
              className="text-xs text-destructive hover:underline"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: "admin" | "member" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        role === "admin"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {role}
    </span>
  );
}
