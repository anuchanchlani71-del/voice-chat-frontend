import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from './router';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import { getAdminToken } from './services/adminApi';
import { AdminProvider } from './context/AdminContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Friendships from './pages/Friendships';
import VoiceCalls from './pages/VoiceCalls';
import GroupVoiceRooms from './pages/GroupVoiceRooms';
import Reports from './pages/Reports';
import BlockedUsers from './pages/BlockedUsers';
import Interests from './pages/Interests';
import IcebreakerPrompts from './pages/IcebreakerPrompts';
import Notifications from './pages/Notifications';
import SafetyCenter from './pages/SafetyCenter';
import RepeatOffenders from './pages/RepeatOffenders';
import AppealRequests from './pages/AppealRequests';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
import AdminProfile from './pages/AdminProfile';
import Plans from './pages/Plans';
import Subscriptions from './pages/Subscriptions';

// User Pages (Part 1 & 2: Foundation, Auth, Onboarding, Discover, Profile, Member Profile, Friend Requests, Friends List, Voice Chat & Call History)
import UserHomeLanding from './pages/user/UserHomeLanding';
import UserDiscover from './pages/user/UserDiscover';
import UserProfile from './pages/user/UserProfile';
import UserOtherProfile from './pages/user/UserOtherProfile';
import UserFriendRequests from './pages/user/UserFriendRequests';
import UserFriendsList from './pages/user/UserFriendsList';
import UserVoiceChat from './pages/user/UserVoiceChat';
import UserIncomingVoiceCall from './pages/user/UserIncomingVoiceCall';
import UserCallHistory from './pages/user/UserCallHistory';
import UserRoomsLounge from './pages/user/UserRoomsLounge';
import UserActiveVoiceRoom from './pages/user/UserActiveVoiceRoom';
import UserGroupRoomInvite from './pages/user/UserGroupRoomInvite';
import UserMessagesList from './pages/user/UserMessagesList';
import UserConversation from './pages/user/UserConversation';
import UserNotifications from './pages/user/UserNotifications';
import UserSafetyPrivacy from './pages/user/UserSafetyPrivacy';
import UserSettings from './pages/user/UserSettings';
import UserHelpSupport from './pages/user/UserHelpSupport';
import UserEditProfile from './pages/user/UserEditProfile';
import UserLogin from './pages/user/UserLogin';
import UserRegister from './pages/user/UserRegister';
import UserVerify from './pages/user/UserVerify';
import UserOnboardingWelcome from './pages/user/UserOnboardingWelcome';
import UserOnboardingProfile from './pages/user/UserOnboardingProfile';
import UserOnboardingInterests from './pages/user/UserOnboardingInterests';
import { FriendRequestProvider } from './context/FriendRequestContext';
import { MessagesProvider } from './context/MessagesContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { getUserToken } from './services/authApi';

// Route guard for authenticated user screens
function UserProtectedRoute({ children }) {
  const { isLoading } = useAuth();
  const token = getUserToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        color: 'var(--user-text-secondary, #9CA3AF)',
        fontSize: '0.9rem'
      }}>
        Loading session...
      </div>
    );
  }

  return children;
}

// Route guard for guest/public auth screens (/login, /register)
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.isOnboarded ? "/discover" : "/onboarding"} replace />;
  }

  return children;
}

// Route guard for verification screen (/verify)
function VerifyRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user?.isOnboarded) {
    return <Navigate to="/discover" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const pathname = location.pathname;

  // ── Admin Login Route ──────────────────────────────────────────
  if (pathname === '/admin/login' || pathname === '/admin-login') {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
      </Routes>
    );
  }

  // ── User-Facing Public & Dashboard Routes ──
  const isUserRoute =
    pathname === '/' ||
    pathname === '/discover' ||
    pathname === '/rooms' ||
    pathname.startsWith('/room/') ||
    pathname.startsWith('/room-invite/') ||
    pathname === '/messages' ||
    pathname.startsWith('/messages/') ||
    pathname === '/notifications' ||
    pathname === '/safety-privacy' ||
    pathname === '/settings' ||
    pathname === '/help-support' ||
    pathname === '/profile' ||
    pathname === '/profile/edit' ||
    pathname === '/requests' ||
    pathname === '/friends' ||
    pathname === '/call-history' ||
    pathname.startsWith('/voice/') ||
    pathname.startsWith('/user/') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify' ||
    pathname === '/onboarding' ||
    pathname === '/onboarding/profile' ||
    pathname === '/onboarding/interests';

  if (isUserRoute) {
    return (
      <AuthProvider>
        <SocketProvider>
          <FriendRequestProvider>
            <MessagesProvider>
              <NotificationsProvider>
                <Routes>
                  <Route path="/" element={<UserHomeLanding />} />
                  <Route path="/discover" element={<UserProtectedRoute><UserDiscover /></UserProtectedRoute>} />
                  <Route path="/rooms" element={<UserRoomsLounge />} />
                  <Route path="/room/:roomId" element={<UserProtectedRoute><UserActiveVoiceRoom /></UserProtectedRoute>} />
                  <Route path="/room-invite/:roomId" element={<UserProtectedRoute><UserGroupRoomInvite /></UserProtectedRoute>} />
                  <Route path="/messages" element={<UserProtectedRoute><UserMessagesList /></UserProtectedRoute>} />
                  <Route path="/messages/:userId" element={<UserProtectedRoute><UserConversation /></UserProtectedRoute>} />
                  <Route path="/notifications" element={<UserProtectedRoute><UserNotifications /></UserProtectedRoute>} />
                  <Route path="/safety-privacy" element={<UserProtectedRoute><UserSafetyPrivacy /></UserProtectedRoute>} />
                  <Route path="/settings" element={<UserProtectedRoute><UserSettings /></UserProtectedRoute>} />
                  <Route path="/help-support" element={<UserHelpSupport />} />
                  <Route path="/profile/edit" element={<UserProtectedRoute><ErrorBoundary title="Profile Edit Unavailable"><UserEditProfile /></ErrorBoundary></UserProtectedRoute>} />
                  <Route path="/profile" element={<UserProtectedRoute><ErrorBoundary title="Profile Unavailable"><UserProfile /></ErrorBoundary></UserProtectedRoute>} />
                  <Route path="/requests" element={<UserProtectedRoute><UserFriendRequests /></UserProtectedRoute>} />
                  <Route path="/friends" element={<UserProtectedRoute><UserFriendsList /></UserProtectedRoute>} />
                  <Route path="/call-history" element={<UserProtectedRoute><UserCallHistory /></UserProtectedRoute>} />
                  <Route path="/voice/incoming/:userId" element={<UserProtectedRoute><UserIncomingVoiceCall /></UserProtectedRoute>} />
                  <Route path="/voice/:userId" element={<UserProtectedRoute><UserVoiceChat /></UserProtectedRoute>} />
                  <Route path="/user/:id" element={<UserOtherProfile />} />
                  <Route path="/login" element={<PublicOnlyRoute><UserLogin /></PublicOnlyRoute>} />
                  <Route path="/register" element={<PublicOnlyRoute><UserRegister /></PublicOnlyRoute>} />
                  <Route path="/verify" element={<VerifyRoute><UserVerify /></VerifyRoute>} />
                  <Route path="/onboarding" element={<UserOnboardingWelcome />} />
                  <Route path="/onboarding/profile" element={<UserOnboardingProfile />} />
                  <Route path="/onboarding/interests" element={<UserOnboardingInterests />} />
                </Routes>
              </NotificationsProvider>
            </MessagesProvider>
          </FriendRequestProvider>
        </SocketProvider>
      </AuthProvider>
    );
  }

  // ── Admin Route Guard: check if Admin JWT exists in localStorage ───
  const token = getAdminToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // ── Protected Admin Panel Routes ───────────────────────────────
  return (
    <AdminProvider>
      <div className={`app-container ${isSidebarCollapsed ? 'sidebar-is-collapsed' : 'sidebar-is-expanded'}`}>
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="main-content">
          <Header
            isCollapsed={isSidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
          />

          <main className="page-body">
            <Routes>
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<Users />} />
              <Route path="/friendships" element={<Friendships />} />
              <Route path="/friend-requests" element={<Friendships defaultTab="pending" />} />
              <Route path="/voice-calls" element={<VoiceCalls />} />
              <Route path="/voice-chat-activity" element={<VoiceCalls />} />
              <Route path="/group-voice-rooms" element={<GroupVoiceRooms />} />
              <Route path="/group-rooms" element={<GroupVoiceRooms />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/blocked-users" element={<BlockedUsers />} />
              <Route path="/interests" element={<Interests />} />
              <Route path="/icebreaker-prompts" element={<IcebreakerPrompts />} />
              <Route path="/admin/notifications" element={<Notifications />} />
              <Route path="/safety-center" element={<SafetyCenter />} />
              <Route path="/safety-moderation" element={<SafetyCenter />} />
              <Route path="/repeat-offenders" element={<RepeatOffenders />} />
              <Route path="/safety-center/repeat-offenders" element={<RepeatOffenders />} />
              <Route path="/appeal-requests" element={<AppealRequests />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/plans" element={<Plans />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/admin/subscriptions" element={<Subscriptions />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin-profile" element={<AdminProfile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}
