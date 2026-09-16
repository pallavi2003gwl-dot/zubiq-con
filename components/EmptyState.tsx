export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
