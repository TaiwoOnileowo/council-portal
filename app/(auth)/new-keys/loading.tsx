export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <span className="inline-block w-8 h-8 border-[3px] border-portal-border border-t-portal-accent rounded-full animate-spin" />
      <p className="text-sm text-portal-muted">Verifying your link...</p>
    </div>
  );
}
