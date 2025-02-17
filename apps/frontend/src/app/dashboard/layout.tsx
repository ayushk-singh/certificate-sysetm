import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster"


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <AppSidebar />

        {/* Content Area */}
        <main className="flex-1 min-h-screen p-4">
          <SidebarTrigger />
          {children}
          <Toaster />
        </main>
      </div>
    </SidebarProvider>
  );
}
