import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, createRoutesFromChildren, matchRoutes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import { lazyPage } from "./lib/lazyPage.js";
import NotFound from "./pages/NotFound.jsx";

// Every public page is its own chunk (the shared shell — header, footer, SEO,
// i18n, router — stays in the main bundle); NotFound stays in it too.

const Home = lazyPage(() => import("./pages/Home.jsx"));
const About = lazyPage(() => import("./pages/About.jsx"));
const History = lazyPage(() => import("./pages/History.jsx"));
const Stupa = lazyPage(() => import("./pages/Stupa.jsx"));
const OdishaVihara = lazyPage(() => import("./pages/OdishaVihara.jsx"));
const DudjomRinpoche = lazyPage(() => import("./pages/DudjomRinpoche.jsx"));
const VajraMasters = lazyPage(() => import("./pages/VajraMasters.jsx"));
const Presidents = lazyPage(() => import("./pages/Presidents.jsx"));
const MasterDetail = lazyPage(() => import("./pages/MasterDetail.jsx"));
const BoardMembers = lazyPage(() => import("./pages/BoardMembers.jsx"));
const Shedra = lazyPage(() => import("./pages/Shedra.jsx"));
const GraduateMonks = lazyPage(() => import("./pages/GraduateMonks.jsx"));
const PujaList = lazyPage(() => import("./pages/PujaList.jsx"));
const PrayerBooks = lazyPage(() => import("./pages/PrayerBooks.jsx"));
const CommunitySupport = lazyPage(() => import("./pages/CommunitySupport.jsx"));
const Support = lazyPage(() => import("./pages/Support.jsx"));
const SupportYoungMonks = lazyPage(() => import("./pages/SupportYoungMonks.jsx"));
const HostelProject = lazyPage(() => import("./pages/HostelProject.jsx"));
const Expenditures = lazyPage(() => import("./pages/Expenditures.jsx"));
const News = lazyPage(() => import("./pages/News.jsx"));
const NewsDetail = lazyPage(() => import("./pages/NewsDetail.jsx"));
const Magazine = lazyPage(() => import("./pages/Magazine.jsx"));
const Publications = lazyPage(() => import("./pages/Publications.jsx"));
const Gallery = lazyPage(() => import("./pages/Gallery.jsx"));
const Apps = lazyPage(() => import("./pages/Apps.jsx"));
const Contact = lazyPage(() => import("./pages/Contact.jsx"));
const Offering = lazyPage(() => import("./pages/Offering.jsx"));
const Terms = lazyPage(() => import("./pages/Terms.jsx"));
const Privacy = lazyPage(() => import("./pages/Privacy.jsx"));

// Admin screens (and Firebase) load only when someone opens /admin.
const AdminRoot = lazy(() => import("./admin/AdminRoot.jsx"));
const ProtectedRoute = lazy(() => import("./admin/ProtectedRoute.jsx"));
const AdminLayout = lazy(() => import("./admin/AdminLayout.jsx"));
const Login = lazy(() => import("./admin/Login.jsx"));
const Dashboard = lazy(() => import("./admin/Dashboard.jsx"));
const CollectionList = lazy(() => import("./admin/CollectionList.jsx"));
const CollectionForm = lazy(() => import("./admin/CollectionForm.jsx"));

// The route tree, also used by preloadRoute() below.
const routes = (
  <>
    {/* ---- Admin (no public chrome) ---- */}
    <Route element={<Suspense fallback={null}><AdminRoot /></Suspense>}>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path=":coll" element={<CollectionList />} />
          <Route path=":coll/new" element={<CollectionForm />} />
          <Route path=":coll/:id" element={<CollectionForm />} />
        </Route>
      </Route>
    </Route>

    {/* ---- Public site ---- */}
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/history" element={<History />} />
      <Route path="/stupa" element={<Stupa />} />
      <Route path="/odisha-vihara" element={<OdishaVihara />} />
      <Route path="/dudjom-rinpoche" element={<DudjomRinpoche />} />
      <Route path="/vajra-masters" element={<VajraMasters />} />
      <Route path="/vajra-masters/:slug" element={<MasterDetail />} />
      <Route path="/presidents" element={<Presidents />} />
      <Route path="/presidents/:slug" element={<MasterDetail />} />
      <Route path="/board-members" element={<BoardMembers />} />
      <Route path="/shedra" element={<Shedra />} />
      <Route path="/graduate-monks" element={<GraduateMonks />} />
      <Route path="/puja" element={<PujaList />} />
      <Route path="/prayer-books" element={<PrayerBooks />} />
      <Route path="/community-support" element={<CommunitySupport />} />
      <Route path="/support" element={<Support />} />
      <Route path="/support-young-monks" element={<SupportYoungMonks />} />
      <Route path="/offering" element={<Offering />} />
      <Route path="/hostel-project" element={<HostelProject />} />
      <Route path="/expenditures" element={<Expenditures />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:slug" element={<NewsDetail />} />
      <Route path="/magazine" element={<Magazine />} />
      <Route path="/publications" element={<Publications />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/apps" element={<Apps />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/lama-sonam-tashi" element={<Navigate to="/presidents/lama-sonam-tashi-rinpoche" replace />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </>
);

// Loads the page chunk(s) of an (unprefixed) app path, e.g. before the first
// render (main.jsx). Resolves when they are ready; never rejects.
export function preloadRoute(pathname) {
  const matches = matchRoutes(createRoutesFromChildren(routes), pathname) || [];
  return Promise.all(
    matches.map((m) => m.route.element?.type?.preload?.()).filter(Boolean)
  ).catch(() => null);
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>{routes}</Routes>
    </>
  );
}
