import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, Shield, FileText, ArrowRight, Briefcase } from 'lucide-react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SearchResultChunk, Project } from '../types/index.ts';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (id: string) => void;
}

export default function SmartSearchModal({ isOpen, onClose, onSelectDoc }: SmartSearchModalProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [formatFilter, setFormatFilter] = useState('All Formats');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultChunk[]>([]);
  const [projectMatches, setProjectMatches] = useState<Project[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setProjectMatches([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const res = await api.smartSearch({
        q: query.trim(),
        dept: deptFilter,
        format: formatFilter,
        role: user?.role || 'admin'
      });
      setResults(res.results || []);
      setProjectMatches(res.projectMatches || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-3xl" style={{ maxHeight: '85vh' }}>
        {/* Header / Search input bar */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search policies, specs, financial reports, vendor matrices... (e.g. 'PTO', 'Titan', 'CSAT')"
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-xl text-sm outline-none transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-5 py-3 rounded-xl text-sm font-semibold"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </form>

          {/* Sub-row: Department, Format filters, RBAC badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Department:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none"
                >
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Finance</option>
                  <option>HR</option>
                  <option>Legal</option>
                  <option>Operations</option>
                  <option>IT</option>
                  <option>Sales</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Format:</span>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none"
                >
                  <option>All Formats</option>
                  <option>PDF</option>
                  <option>DOCX</option>
                  <option>CSV</option>
                  <option>XLSX</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              <Shield size={13} />
              <span>RBAC Filtered ({user?.role === 'admin' ? 'Admin' : 'Employee'})</span>
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[350px]">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                <Sparkles size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Smart Cross-Document Neural & Keyword Search
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1.5">
                Enter keywords or concepts above to retrieve verified text passages from indexed enterprise documents.
              </p>
            </div>
          ) : results.length === 0 && projectMatches.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No matching verified passages found for "{query}".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Project matches */}
              {projectMatches.length > 0 && (
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Briefcase size={13} />
                    <span>Matched Project Records ({projectMatches.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {projectMatches.map((proj) => (
                      <div
                        key={proj.code}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {proj.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {proj.status}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1">{proj.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{proj.scope}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Chunks */}
              {results.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText size={13} />
                    <span>Verified Document Passages ({results.length})</span>
                  </div>
                  <div className="space-y-3">
                    {results.map((r) => (
                      <div
                        key={r.chunkId}
                        className="p-4 bg-white border border-slate-200/90 rounded-xl hover:border-indigo-300 transition-colors shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {r.documentTitle}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              • {r.department}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              onSelectDoc(r.documentId);
                              onClose();
                            }}
                            className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                          >
                            <span>Inspect</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed font-mono">
                          {r.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
