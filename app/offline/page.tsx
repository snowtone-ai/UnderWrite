import { Logo } from "@/components/logo";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[400px] flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div>
        <h1 className="text-[22px] font-bold">オフラインです</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          インターネット接続が確認できません。
          <br />
          接続が回復したら自動で再読み込みします。
        </p>
      </div>
    </main>
  );
}
