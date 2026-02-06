import React from "react";
import PropTypes from "prop-types";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";

// Pages
import SignIn from "./pages/SignIn.js";
import SignUp from "./pages/SignUp.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Home from "./pages/user/Home.js";
import JoinUs from "./pages/user/JoinUs.js";
import Profile from "./pages/user/Profile.jsx";
import About from "./pages/user/About.js";
import Events from "./pages/user/Events.js";
import Contact from "./pages/user/Contact.js";
import Story from "./pages/user/Story.js";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard.js";
import StaffContact from "./pages/staff/StaffContact.js";
import StaffProfile from "./pages/staff/StaffProfile.js";
import StaffEvents from "./pages/staff/StaffEvent.js";
import StaffVerification from "./pages/staff/StaffVerification.jsx";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminJoinRequests from "./pages/admin/AdminJoinRequests.jsx";
import AdminEvents from "./pages/admin/AdminEvent.js";
import AdminUpdates from "./pages/admin/AdminUpdates.js";
import AdminUsers from "./pages/admin/AdminUsers.js";
import AdminDonations from "./pages/admin/AdminDonations.js";
import MedicalRequest from "./pages/admin/MedicalRequest.jsx";
import HospitalManagement from "./pages/admin/HospitalManagement.jsx";
import AdminStory from "./pages/admin/AdminStory.jsx";

// Components
import Navbar from "./components/Navbar.jsx";
import PublicNavbar from "./components/PublicNavbar.jsx";
import StaffNavbar from "./components/staffNavbar.js";
import AdminNavbar from "./components/AdminNavbar.jsx";
import Footer from "./components/Footer.js";
import PublicFooter from "./components/PublicFooter.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ApplyMedicalSupport from "./components/ApplyMedicalSupport.jsx";
import StatusPage from "./components/StatusPage.jsx";
import NotificationsPage from "./components/NotificationsPage.jsx";
import MobileBlocker from "./components/MobileBlocker.jsx";
import NetworkStatus from "./components/NetworkStatus.jsx"; // ✅ NEW: Import offline game feature

// Context
import { UserProvider, useUser } from "./shared/contexts/UserContext.js";

// Import Activity Tracker Hook
import { useActivityTracker } from "./shared/hooks/useActivityTracker";

// Auth Layout - For SignIn, SignUp, ForgotPassword, ResetPassword (with transparent footer)
function AuthLayout({ children }) {
  return (
    <div className="layout">
      <PublicNavbar />
      <main className="content">{children}</main>
      <PublicFooter />
    </div>
  );
}
AuthLayout.propTypes = { children: PropTypes.node.isRequired };

// Public Layout - For other public pages (with normal footer)
function PublicLayout({ children }) {
  return (
    <div className="layout">
      <PublicNavbar />
      <main className="content">{children}</main>
      <Footer />
    </div>
  );
}
PublicLayout.propTypes = { children: PropTypes.node.isRequired };

function ProtectedLayout({ children }) {
  const { user } = useUser();
  
  // Track user activity automatically
  useActivityTracker(user?._id || user?.id);
  
  if (!user) return null;

  let NavbarComponent = null;
  if (user.role === "admin") NavbarComponent = <AdminNavbar />;
  else if (user.role === "staff") NavbarComponent = <StaffNavbar />;
  else if (user.role === "user") NavbarComponent = <Navbar />;

  return (
    <div className="layout">
      {NavbarComponent}
      <main className="content">{children}</main>
      <Footer />
    </div>
  );
}
ProtectedLayout.propTypes = { children: PropTypes.node.isRequired };

// Hybrid Layout - Shows appropriate navbar based on authentication
function HybridLayout({ children }) {
  const { user } = useUser();
  
  // Track user activity if logged in
  useActivityTracker(user?._id || user?.id);
  
  let NavbarComponent = null;
  
  if (user) {
    // User is authenticated - show role-based navbar
    if (user.role === "admin") NavbarComponent = <AdminNavbar />;
    else if (user.role === "staff") NavbarComponent = <StaffNavbar />;
    else if (user.role === "user") NavbarComponent = <Navbar />;
  } else {
    // User is not authenticated - show public navbar
    NavbarComponent = <PublicNavbar />;
  }

  return (
    <div className="layout">
      {NavbarComponent}
      <main className="content">{children}</main>
      <Footer />
    </div>
  );
}
HybridLayout.propTypes = { children: PropTypes.node.isRequired };

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Auth Routes - with PublicFooter (Transparent) */}
      <Route path="/" element={<AuthLayout><SignIn /></AuthLayout>} />
      <Route path="/signin" element={<AuthLayout><SignIn /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout><SignUp /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
      <Route path="/reset-password/:token" element={<AuthLayout><ResetPassword /></AuthLayout>} />
      
      {/* Hybrid Routes - accessible to both public and authenticated users */}
      <Route path="/about" element={<HybridLayout><About /></HybridLayout>} />
      <Route path="/events" element={<HybridLayout><Events /></HybridLayout>} />
      <Route path="/story" element={<HybridLayout><Story /></HybridLayout>} />

      {/* User Routes */}
      <Route path="/home" element={<ProtectedRoute allowedRoles={["user"]}><ProtectedLayout><Home /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/contact" element={<ProtectedRoute allowedRoles={["user"]}><ProtectedLayout><Contact /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/joinus" element={<ProtectedRoute allowedRoles={["user"]}><ProtectedLayout><JoinUs /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/join-us" element={<ProtectedRoute allowedRoles={["user"]}><ProtectedLayout><JoinUs /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={["user"]}><ProtectedLayout><Profile /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/apply" element={<ProtectedRoute allowedRoles={["user", "staff"]}><ProtectedLayout><ApplyMedicalSupport /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/status/:id" element={<ProtectedRoute allowedRoles={["user", "staff"]}><ProtectedLayout><StatusPage /></ProtectedLayout></ProtectedRoute>} />

      {/* Notifications Route - Available to all authenticated users */}
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={["user", "staff", "admin"]}><ProtectedLayout><NotificationsPage /></ProtectedLayout></ProtectedRoute>} />

      {/* Staff Routes */}
      <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={["staff"]}><ProtectedLayout><StaffDashboard /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/staff/contact" element={<ProtectedRoute allowedRoles={["staff"]}><ProtectedLayout><StaffContact /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/staff/profile" element={<ProtectedRoute allowedRoles={["staff"]}><ProtectedLayout><StaffProfile /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/staff/events" element={<ProtectedRoute allowedRoles={["staff"]}><ProtectedLayout><StaffEvents /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/staff/verification" element={<ProtectedRoute allowedRoles={["staff"]}><ProtectedLayout><StaffVerification /></ProtectedLayout></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><AdminDashboard /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><AdminUsers /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/updates" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><AdminUpdates /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/events" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><AdminEvents /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/join-requests" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><AdminJoinRequests /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/donations" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><AdminDonations /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/medical-requests" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><MedicalRequest /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/hospitals" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><HospitalManagement /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/admin/story" element={<ProtectedRoute allowedRoles={["admin"]}><ProtectedLayout><AdminStory /></ProtectedLayout></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </>
  )
);

function App() {
  return (
    <MobileBlocker>
      <UserProvider>
        {/* ✅ NEW: NetworkStatus wrapper - Shows game when server is offline */}
        <NetworkStatus>
          <RouterProvider router={router} />
        </NetworkStatus>
      </UserProvider>
    </MobileBlocker>
  );
}

export default App;