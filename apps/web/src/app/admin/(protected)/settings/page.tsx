export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Global application configuration.</p>
      </div>
      <div className="rounded-md border bg-white p-8 text-center text-slate-500">
        Platform branding, rendering mode options, and storage configurations will be managed here.
      </div>
    </div>
  );
}
