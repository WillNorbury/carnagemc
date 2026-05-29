import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/site/AppSidebar";
import { SwipeToOpenSidebar } from "@/components/site/SwipeToOpenSidebar";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import AdminRoles from "./pages/AdminRoles.tsx";
import AdminPermissions from "./pages/AdminPermissions.tsx";
import News from "./pages/News.tsx";
import NewsArticle from "./pages/NewsArticle.tsx";
import Staff from "./pages/Staff.tsx";
import Vote from "./pages/Vote.tsx";
import Community from "./pages/Community.tsx";
import Rules from "./pages/Rules.tsx";
import Support from "./pages/Support.tsx";
import Tickets from "./pages/Tickets.tsx";
import Profile from "./pages/Profile.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Users from "./pages/Users.tsx";
import Plugins from "./pages/Plugins.tsx";
import PluginDetail from "./pages/PluginDetail.tsx";
import Changelog from "./pages/Changelog.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import LinkAccount from "./pages/LinkAccount.tsx";
import Apply from "./pages/Apply.tsx";
import AdminChangelog from "./pages/AdminChangelog.tsx";
import AdminNews from "./pages/AdminNews.tsx";
import AdminApplications from "./pages/AdminApplications.tsx";
import Features from "./pages/Features.tsx";
import FeatureDetail from "./pages/FeatureDetail.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Faq from "./pages/Faq.tsx";
import Events from "./pages/Events.tsx";
import AdminFaqs from "./pages/AdminFaqs.tsx";
import AdminEvents from "./pages/AdminEvents.tsx";
import AdminMaintenance from "./pages/AdminMaintenance.tsx";
import AdminMods from "./pages/AdminMods.tsx";
import Mods from "./pages/Mods.tsx";
import ModDetail from "./pages/ModDetail.tsx";
import ModTiers from "./pages/ModTiers.tsx";
import { MaintenanceGate } from "./components/site/MaintenanceGate.tsx";
import OrgProfile from "./pages/OrgProfile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Shell = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  return (
    <MaintenanceGate>
      <SidebarProvider>
        {!isAdmin && <AppSidebar />}
        {!isAdmin && <SwipeToOpenSidebar />}
        <SidebarInset>
          <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/roles" element={<AdminRoles />} />
                  <Route path="/admin/permissions" element={<AdminPermissions />} />
                  <Route path="/admin/changelog" element={<AdminChangelog />} />
                  <Route path="/admin/applications" element={<AdminApplications />} />
                  <Route path="/admin/news" element={<AdminNews />} />
                  <Route path="/admin/announcements" element={<AdminNews />} />
                  <Route path="/admin/faqs" element={<AdminFaqs />} />
                  <Route path="/admin/events" element={<AdminEvents />} />
                  <Route path="/admin/maintenance" element={<AdminMaintenance />} />
                  <Route path="/admin/mods" element={<AdminMods />} />
                  <Route path="/discover/mods" element={<Mods />} />
                  <Route path="/mod/:slug" element={<ModDetail />} />
                  <Route path="/mod-tiers" element={<ModTiers />} />
                  <Route path="/changelog" element={<Changelog />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/link-account" element={<LinkAccount />} />
                  <Route path="/apply" element={<Apply />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/announcements" element={<News />} />
                  <Route path="/news/:slug" element={<NewsArticle />} />
                  <Route path="/announcements/:slug" element={<NewsArticle />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/vote" element={<Vote />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/user/:slug" element={<UserProfile />} />
                  <Route path="/org/:slug" element={<OrgProfile />} />
                  <Route path="/discover/plugins" element={<Plugins />} />
                  <Route path="/discover/plugins/:shortId" element={<PluginDetail />} />
                  <Route path="/plugin/:slug" element={<PluginDetail />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/features/:slug" element={<FeatureDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="*" element={<NotFound />} />
          </Routes>
        </SidebarInset>
      </SidebarProvider>
    </MaintenanceGate>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
