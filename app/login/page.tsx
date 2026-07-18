"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    router.push("/scans");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-[400px] flex-col items-center justify-center px-4">
      <div className="w-full">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="mb-1 text-lg font-bold">ログイン</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            アカウント情報を入力してください
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs text-muted-foreground">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs text-muted-foreground">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? "ログイン中…" : "ログイン"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
