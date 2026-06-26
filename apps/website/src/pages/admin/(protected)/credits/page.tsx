export default function CreditsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
        <p className="text-muted-foreground">Manage credit allocations.</p>
      </div>
      <div className="rounded-md border bg-white p-8 text-center text-slate-500">
        Credit management will be available in v2. Currently handled via unlimited active plans.
      </div>
    </div>
  );
}
