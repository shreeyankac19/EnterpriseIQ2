import React from 'react';
import {
  LayoutDashboard,
  Bot,
  FileText,
  Briefcase,
  Search,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenSearch: () => void;
}

export default function Sidebar({ currentView, setCurrentView, onOpenSearch }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'AI' },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'projects', label: 'Project Analytics', icon: Briefcase },
    { id: 'search', label: 'Smart Search', icon: Search }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <Sparkles size={20} />
        </div>
        <div className="brand-text">
          <h1>EnterpriseIQ</h1>
          <span>KNOWLEDGE SYSTEM</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Workspace</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'search') {
                  onOpenSearch();
                } else {
                  setCurrentView(item.id);
                }
              }}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* RBAC Security Card */}
      <div className="px-4 pb-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
            <ShieldCheck size={14} />
            <span>RBAC Active</span>
          </div>
          <div className="text-slate-300">
            Clearance: <strong className="text-white capitalize">{user?.role || 'Guest'}</strong>
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Dept: {user?.department || 'Executive'}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.avatar_initial || user?.name?.charAt(0) || 'E'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'Eleanor Vance'}</div>
            <div className="user-role-tag capitalize">
              {user?.role} • {user?.department}
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
