import { Navbar } from "@/components/layout/navbar";

// Lessons get the navbar but no marketing footer, to keep focus on learning.
export default function LearnLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
