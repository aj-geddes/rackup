import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icons from './Icons';

function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return null;
      case '/standings': return 'Standings';
      case '/schedule': return 'Schedule';
      case '/team': return 'My Team';
      case '/profile': return 'Profile';
      default:
        if (location.pathname.startsWith('/admin')) return 'Administration';
        return null;
    }
  };

  const title = getTitle();

  return (
    <>
      <header className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              {user?.avatar || user?.firstName?.[0] || '?'}
            </div>
            <div>
              <p className="text-sm opacity-90">Welcome back,</p>
              <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <NavLink
            to="/profile"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Icons.User />
          </NavLink>
        </div>
      </header>

      {title && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-16 z-10">
          <h1 className="text-lg font-semibold text-gray-800 max-w-lg mx-auto">{title}</h1>
        </div>
      )}
    </>
  );
}

function BottomNav() {
  const { isLeagueOfficial } = useAuth();

  const tabs = [
    { to: '/', icon: Icons.Home, label: 'Home' },
    { to: '/standings', icon: Icons.Trophy, label: 'Standings' },
    { to: '/schedule', icon: Icons.Calendar, label: 'Schedule' },
    { to: '/team', icon: Icons.Users, label: 'My Team' },
    ...(isLeagueOfficial
      ? [{ to: '/admin', icon: Icons.Settings, label: 'Admin' }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-20">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-full transition-colors ${
                isActive ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-4 py-6 pb-24 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
