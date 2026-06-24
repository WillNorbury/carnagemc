import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import PluginSettings from "./pages/PluginSettings.tsx";
import Changelog from "./pages/Changelog.tsx";
import ReleaseNotes from "./pages/ReleaseNotes.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import LinkAccount from "./pages/LinkAccount.tsx";
import Apply from "./pages/Apply.tsx";
import Features from "./pages/Features.tsx";
import FeatureDetail from "./pages/FeatureDetail.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Faq from "./pages/Faq.tsx";
import Events from "./pages/Events.tsx";
import Mods from "./pages/Mods.tsx";
import ModDetail from "./pages/ModDetail.tsx";
import ModTiers from "./pages/ModTiers.tsx";
import { MaintenanceGate } from "./components/site/MaintenanceGate.tsx";
import OrgProfile from "./pages/OrgProfile.tsx";
import Install from "./pages/Install.tsx";
import NotFound from "./pages/NotFound.tsx";
import ResourcePacks from "./pages/ResourcePacks.tsx";
import DataPacks from "./pages/DataPacks.tsx";
import Shaders from "./pages/Shaders.tsx";
import Modpacks from "./pages/Modpacks.tsx";
import Servers from "./pages/Servers.tsx";
import Status from "./pages/Status.tsx";
import StatusIncident from "./pages/StatusIncident.tsx";
import BanAppeals from "./pages/BanAppeals.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import Subscribe from "./pages/Subscribe.tsx";
import Wiki from "./pages/Wiki.tsx";
import WikiArticle from "./pages/WikiArticle.tsx";
import Gallery from "./pages/Gallery.tsx";
import Contact from "./pages/Contact.tsx";
import Trust from "./pages/Trust.tsx";
import QuizListPage from "./pages/Quiz.tsx";
import QuizTake from "./pages/QuizTake.tsx";
import QuizResult from "./pages/QuizResult.tsx";
import QuizLeaderboard from "./pages/QuizLeaderboard.tsx";
import DiscoverItemDetail from "./pages/DiscoverItemDetail.tsx";
import Discover from "./pages/Discover.tsx";


const queryClient = new QueryClient();

// Generic fallback: any unmatched /admin/<seg>[/...] URL becomes /admin?tab=<seg>.
const AdminTabRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/admin\/?/, "");
  const firstSeg = rest.split("/")[0] ?? "";
  if (!firstSeg) return <Navigate to={`/admin${search}${hash}`} replace />;
  return <Navigate to={`/admin?tab=${encodeURIComponent(firstSeg)}`} replace />;
};

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
                  <Route path="/admin/announcements" element={<Navigate to="/admin?tab=news" replace />} />
                  <Route path="/admin/*" element={<AdminTabRedirect />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/discover/mods" element={<Mods />} />
                  <Route path="/mod/:slug" element={<ModDetail />} />
                  <Route path="/mod-tiers" element={<ModTiers />} />
                  <Route path="/changelog" element={<Changelog />} />
                  <Route path="/release-notes" element={<ReleaseNotes />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/link-account" element={<LinkAccount />} />
                  <Route path="/apply" element={<Apply />} />
                  <Route path="/apply/:slug" element={<Apply />} />
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
                  <Route path="/plugins/:slug/settings" element={<PluginSettings />} />
                  <Route path="/plugins/:slug" element={<PluginDetail />} />
                  <Route path="/discover/resource-packs" element={<ResourcePacks />} />
                  <Route path="/resource-pack/:slug" element={<DiscoverItemDetail urlKind="resource-pack" />} />
                  <Route path="/discover/data-packs" element={<DataPacks />} />
                  <Route path="/data-pack/:slug" element={<DiscoverItemDetail urlKind="data-pack" />} />
                  <Route path="/discover/shaders" element={<Shaders />} />
                  <Route path="/shader/:slug" element={<DiscoverItemDetail urlKind="shader" />} />
                  <Route path="/discover/modpacks" element={<Modpacks />} />
                  <Route path="/modpack/:slug" element={<DiscoverItemDetail urlKind="modpack" />} />
                  <Route path="/discover/servers" element={<Servers />} />
                  <Route path="/server/:slug" element={<DiscoverItemDetail urlKind="server" />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/features/:slug" element={<FeatureDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/status" element={<Status />} />
                  <Route path="/status/:number" element={<StatusIncident />} />
                  <Route path="/appeal" element={<BanAppeals />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/subscribe" element={<Subscribe />} />
                  <Route path="/ban-appeals" element={<Navigate to="/appeal" replace />} />
                  <Route path="/wiki" element={<Wiki />} />
                  <Route path="/wiki/:slug" element={<WikiArticle />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/trust" element={<Trust />} />
                  <Route path="/quiz" element={<QuizListPage />} />
                  <Route path="/quiz/:slug" element={<QuizTake />} />
                  <Route path="/quiz/:slug/leaderboard" element={<QuizLeaderboard />} />
                  <Route path="/quiz/:slug/result/:attemptId" element={<QuizResult />} />
                  
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
