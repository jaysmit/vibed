import { Header } from '@/components/ui';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="pb-20 sm:pb-0">
        {children}
      </div>
    </>
  );
}
