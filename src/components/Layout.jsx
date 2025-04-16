// src/components/Layout.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useKindeAuth } from '../auth/KindeAuth';
import { useAppContext } from '../context/AppContext';

export default function Layout({ children }) {
  const { user, logout } = useKindeAuth();
  const { notifications = [] } = useAppContext();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const navigation = [
    { name: 'Dashboard', path: '/' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Users', path: '/users' },
    { name: 'Notifications', path: '/notifications', badge: unreadCount > 0 ? unreadCount : null },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className="bg-white shadow md:hidden">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="font-semibold text-lg">Task Rotation Manager</div>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {menuOpen && (
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="flex justify-between items-center">
                  {item.name}
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            
            <button
              onClick={logout}
              className="w-full text-left text-gray-700 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white shadow">
          <div className="p-4 border-b">
            <div className="text-xl font-bold text-gray-900">Task Rotation</div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  } group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium`}
                >
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          
          {user && (
            <div className="p-4 border-t">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.given_name ? (
                    <span>{user.given_name.charAt(0).toUpperCase()}</span>
                  ) : (
                    <span>{user.email.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user.given_name || user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="md:ml-64 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}