import React, { useState } from 'react';
import { Search, Shield, ChevronDown, UploadCloud, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenUpload: () => void;
}

export default function Topbar({ onOpenSearch, onOpenUpload }: TopbarProps) {
  const { user, demoUsers, switchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleName = user?.role ? user.role.toUpperCase() : 'ADMIN';

  return (
    <header className="topbar">
      {/* Search Bar Trigger */}
      <button className="topbar-search-trigger" onClick={onOpenSearch}>
        <Search size={16} />
        <span>Search policies, documents, projects...</span>
        <span className="kbd-badge">Ctrl K</span>
      </button>

      {/* Topbar Actions */}
      <div className="topbar-actions">
        {/* Quick Upload Button */}
        <button
          className="btn btn-secondary py-1.5 px-3.5 text-xs"
          onClick={onOpenUpload}
        >
          <UploadCloud size={16} className="text-indigo-600" />
          <span>Upload File</span>
        </button>

        {/* 1-Click Role Switcher Dropdown */}
        <div className="role-switcher-dropdown">
          <button
            className="role-badge-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Switch User Role to test RBAC clearance"
          >
            <Shield size={14} className="text-indigo-600" />
            <span>Role:</span>
            <span className={`role-tag-pill ${user?.role || 'admin'}`}>{roleName}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-[115%] w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-40">
                <div className="px-2 pb-2 mb-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800">
                    Switch User Role (Test RBAC)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Switch roles instantly to verify confidential document isolation.
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {demoUsers.map((dUser) => {
                    const isSelected = user?.username === dUser.username;
                    return (
                      <button
                        key={dUser.username}
                        onClick={() => {
                          switchUser(dUser);
                          setDropdownOpen(false);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-lg text-left w-full transition-colors ${
                          isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {dUser.avatar_initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              {dUser.name}
                            </span>
                            {isSelected && <Check size={14} className="text-indigo-600" />}
                          </div>
                          <div className="text-[11px] text-slate-500 capitalize">
                            {dUser.role} • {dUser.department}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
