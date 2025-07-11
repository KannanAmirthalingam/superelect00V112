import React from 'react';
import { Settings, Bell, User, LogOut, Database } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { signOut, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'boards', label: 'Boards' },
    { id: 'service-request', label: 'Service Request' },
    { id: 'inward-entry', label: 'Inward Entry' },
    { id: 'reports', label: 'Reports' },
    { id: 'master', label: 'Master Data' },
    { id: 'users', label: 'Users' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">SMW</h1>
              <p className="text-xs text-gray-500">Board Tracker</p>
            </div>
            <nav className="ml-10 flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, {user?.email}
            </div>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};