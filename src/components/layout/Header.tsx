import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { companyInfo } from '../../data/mockData';
import ChatDrawer from '../common/ChatDrawer';

export default function Header() {
  const { currentUser, logout, appointments, getMessagesByAppointment } = useApp();
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-gray-300 hover:bg-blue-600 hover:text-white'
    }`;

  // Admin dashboard path is undiscoverable from public UI
  const adminPath = '/internal/admin/dashboard';

  // Count appointments with messages available (for badge)
  const userAppointments = currentUser 
    ? appointments.filter(a => {
        if (currentUser.role === 'customer') {
          return a.customerId === currentUser.id && (a.status === 'accepted' || a.status === 'scheduled');
        } else if (currentUser.role === 'agent') {
          return a.agentId === currentUser.id && (a.status === 'accepted' || a.status === 'scheduled');
        }
        return false;
      })
    : [];

  const totalUnreadMessages = userAppointments.reduce((count, apt) => {
    return count + getMessagesByAppointment(apt.id).length;
  }, 0);

  return (
    <>
      <header className="bg-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Company Name */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-800 font-bold text-xl">T</span>
              </div>
              <div>
                <span className="text-white font-bold text-xl">{companyInfo.name}</span>
                <span className="hidden md:block text-blue-200 text-xs">Davao, Philippines</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-2">
              <Link to="/" className={navLinkClass('/')}>
                Home
              </Link>
              <Link to="/about" className={navLinkClass('/about')}>
                About
              </Link>
              <Link to="/properties" className={navLinkClass('/properties')}>
                Properties
              </Link>

              {/* Role-specific navigation */}
              {currentUser?.role === 'customer' && (
                <>
                  <Link to="/customer/dashboard" className={navLinkClass('/customer/dashboard')}>
                    My Bookings
                  </Link>
                  <Link to="/customer/settings" className={navLinkClass('/customer/settings')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </>
              )}
              {currentUser?.role === 'agent' && (
                <>
                  <Link to="/agent/dashboard" className={navLinkClass('/agent/dashboard')}>
                    Dashboard
                  </Link>
                  <Link to="/agent/calendar" className={navLinkClass('/agent/calendar')}>
                    Calendar
                  </Link>
                  <Link to="/agent/settings" className={navLinkClass('/agent/settings')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </>
              )}
              {/* Admin link is NOT shown in public navigation - admins access via direct URL */}
              {currentUser?.role === 'admin' && (
                <Link to={adminPath} className={navLinkClass(adminPath)}>
                  Admin Panel
                </Link>
              )}

              {/* Chat Button - Only for customers and agents */}
              {currentUser && (currentUser.role === 'customer' || currentUser.role === 'agent') && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="relative ml-2 p-2 rounded-md text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Messages"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {totalUnreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                    </span>
                  )}
                </button>
              )}

              {/* Auth */}
              {currentUser ? (
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-white text-sm hidden sm:inline">
                    {currentUser.name} ({currentUser.role})
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="ml-4 px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Chat Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
