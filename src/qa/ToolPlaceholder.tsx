export function ToolPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface">
      <div className="text-center">
        <p className="mb-2 text-muted">{name}</p>
        <p className="text-[13px] text-muted/60">(QA workspace)</p>
      </div>
    </div>
  )
}
