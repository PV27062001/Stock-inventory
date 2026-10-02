
export default function KirayaBookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1A1A2E] min-h-screen text-white flex flex-col font-sans">
      <main className="flex-grow pb-20">
        {children}
      </main>
    </div>
  );
}
