import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BoardManagement } from './components/BoardManagement';
import { ServiceRequest } from './components/ServiceRequest';
import { InwardEntry } from './components/InwardEntry';
import { Reports } from './components/Reports';
import { MasterData } from './components/MasterData';
import { UserRoles } from './components/UserRoles';
import { Loader, AlertCircle } from 'lucide-react';

function App() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Show login if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'boards':
        return <BoardManagement />;
      case 'service-request':
        return <ServiceRequest />;
      case 'inward-entry':
        return <InwardEntry />;
      case 'reports':
        return <Reports />;
      case 'master':
        return <MasterData />;
      case 'users':
        return <UserRoles />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
}

export default App;