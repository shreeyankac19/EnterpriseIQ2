import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import Sidebar from './components/Sidebar.tsx';
import Topbar from './components/Topbar.tsx';
import DashboardView from './views/DashboardView.tsx';
import AssistantView from './views/AssistantView.tsx';
import DocumentsView from './views/DocumentsView.tsx';
import ProjectsView from './views/ProjectsView.tsx';
import LoginView from './views/LoginView.tsx';
import UploadModal from './components/UploadModal.tsx';
import NewProjectModal from './components/NewProjectModal.tsx';
import SmartSearchModal from './components/SmartSearchModal.tsx';
import InspectDocModal from './components/InspectDocModal.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Global Ctrl+K / Cmd+K shortcut for Smart Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md animate-pulse">
            <span className="font-bold text-lg">IQ</span>
          </div>
          <div className="text-sm font-bold text-slate-800">EnterpriseIQ</div>
          <div className="text-xs text-slate-400 mt-1">Initializing Knowledge Core & SQLite database...</div>
        </div>
      </div>
    );
  }

  // If not logged in, show EnterpriseIQ Access Portal
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      {/* Dark Navy Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="main-wrapper">
        <Topbar
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenUpload={() => setUploadModalOpen(true)}
        />

        <main className="content-area" key={refreshKey}>
          {currentView === 'dashboard' && (
            <DashboardView
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenAssistant={() => setCurrentView('assistant')}
              onSelectDoc={(id) => setSelectedDocId(id)}
            />
          )}

          {currentView === 'assistant' && (
            <AssistantView
              onSelectDoc={(id) => setSelectedDocId(id)}
            />
          )}

          {currentView === 'documents' && (
            <DocumentsView
              onOpenUpload={() => setUploadModalOpen(true)}
              onSelectDoc={(id) => setSelectedDocId(id)}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsView
              onOpenNewProject={() => setNewProjectModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={triggerRefresh}
      />

      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onProjectCreated={triggerRefresh}
      />

      <SmartSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectDoc={(id) => setSelectedDocId(id)}
      />

      <InspectDocModal
        docId={selectedDocId}
        onClose={() => setSelectedDocId(null)}
        onDeleted={triggerRefresh}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
