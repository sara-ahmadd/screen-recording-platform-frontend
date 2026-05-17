export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full font-medium ${className}`}>{children}</span>;
}
