
export default function KirayaBookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col font-sans">
      <main className="flex-grow pb-20">
        {children}
      </main>
    </div>
  );
}
