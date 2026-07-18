"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LogOut, ChevronRight, Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type ScanRow = {
  id: string;
  address: string;
  build_year: number;
  structure: string;
  floor_area_sqm: number;
  status: "pending" | "done" | "failed";
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "解析中",
  done: "完了",
  failed: "エラー",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-muted-foreground",
  done: "text-go",
  failed: "text-destructive",
};

export default function ScansPage() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((d) => setScans(d.scans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single()
        .then(({ data }) => setIsAdmin(data?.role === "admin"));
    });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-28 pt-5">
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              aria-label="ユーザー管理"
            >
              <Settings className="size-3.5" aria-hidden />
              管理
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            aria-label="ログアウト"
          >
            <LogOut className="size-3.5" aria-hidden />
            ログアウト
          </button>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[18px] font-bold">査定一覧</h1>
        <Link href="/scan">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" aria-hidden />
            新しい査定
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">読み込み中…</div>
      ) : scans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">査定履歴がありません</p>
          <Link href="/scan" className="mt-4 inline-block text-sm font-medium text-primary">
            最初の査定を始める →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-2">
          {scans.map((scan) => {
            const date = new Date(scan.created_at).toLocaleString("ja-JP", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <li key={scan.id}>
                <Link
                  href={`/result/${scan.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{scan.address}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {scan.build_year}年 / {scan.structure} / {scan.floor_area_sqm}㎡
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{date}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("text-xs font-medium", STATUS_COLOR[scan.status] ?? "text-muted-foreground")}>
                      {STATUS_LABEL[scan.status] ?? scan.status}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
