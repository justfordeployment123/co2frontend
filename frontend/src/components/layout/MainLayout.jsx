import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

/**
 * MainLayout Component
 * Wraps all pages with consistent header, sidebar (auth only), and footer
 */
const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-midnight-navy via-gray-900 to-midnight-navy">
      {/* Header - always at top */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} showMenuButton={isAuthenticated} />
      
      <div className="flex flex-1">
        {/* Sidebar for authenticated users */}
        {isAuthenticated && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
