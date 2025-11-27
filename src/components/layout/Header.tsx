import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { companyInfo } from '../../data/mockData';

export default function Header() {
  const { currentUser, logout } = useApp();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-gray-300 hover:bg-blue-600 hover:text-white'
    }`;

  return (
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
              <Link to="/customer/dashboard" className={navLinkClass('/customer/dashboard')}>
                My Bookings
              </Link>
            )}
            {currentUser?.role === 'agent' && (
              <Link to="/agent/dashboard" className={navLinkClass('/agent/dashboard')}>
                Dashboard
              </Link>
            )}
            {currentUser?.role === 'admin' && (
              <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                Admin
              </Link>
            )}

            {/* Auth */}
            {currentUser ? (
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-white text-sm">
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
  );
}
