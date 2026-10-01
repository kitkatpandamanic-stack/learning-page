import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
