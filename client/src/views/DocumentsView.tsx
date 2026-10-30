import React, { useState, useEffect } from 'react';
import { Search, UploadCloud, Eye, Shield, Lock, FileText, Filter } from 'lucide-react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DocumentItem } from '../types/index.ts';

interface DocumentsViewProps {
  onOpenUpload: () => void;
  onSelectDoc: (id: string) => void;
}

export default function DocumentsView({ onOpenUpload, onSelectDoc }: DocumentsViewProps) {
  const { user, canAccess } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [formatFilter, setFormatFilter] = useState('All Formats');

  useEffect(() => {
    loadDocs();
  }, [user, deptFilter, formatFilter, search]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments({
        dept: deptFilter,
        format: formatFilter,
        search,
        role: user?.role || 'admin'
      });
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Document Management Repository</h2>
          <p className="page-subtitle">
            Upload, index, and organize enterprise documents across PDF, DOCX, CSV, and Excel formats.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenUpload}>
          <UploadCloud size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, filename, or summary..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 outline-none"
              >
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Finance</option>
                <option>HR</option>
                <option>Legal</option>
                <option>Operations</option>
                <option>General</option>
                <option>IT</option>
                <option>Sales</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Format:</span>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 outline-none"
              >
                <option>All Formats</option>
                <option>PDF</option>
                <option>DOCX</option>
                <option>CSV</option>
                <option>XLSX</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>DOCUMENT DETAILS</th>
                <th>TYPE</th>
                <th>DEPARTMENT</th>
                <th>CONFIDENTIALITY</th>
                <th>SIZE</th>
                <th>CONTENT LENGTH</th>
                <th>UPLOADED BY</th>
                <th>DATE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                    Loading indexed documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                    No matching documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const accessible = canAccess(doc.confidentiality);
                  return (
                    <tr key={doc.id} className={!accessible ? 'opacity-60 bg-slate-50/50' : ''}>
                      <td>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {!accessible && <Lock size={12} className="text-amber-600" />}
                          <span>{doc.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.filename}</div>
                      </td>
                      <td>
                        <span className={`file-badge ${doc.file_type.toLowerCase()}`}>
                          {doc.file_type}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-700">{doc.department}</span>
                      </td>
                      <td>
                        <span className={`conf-badge ${doc.confidentiality.toLowerCase()}`}>
                          <Shield size={10} />
                          <span>{doc.confidentiality}</span>
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600">{doc.formatted_size}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600">{doc.content_length_desc}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-700">{doc.uploaded_by}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500">{doc.upload_date}</span>
                      </td>
                      <td className="text-right">
                        {accessible ? (
                          <button
                            onClick={() => onSelectDoc(doc.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-all shadow-sm"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        ) : (
                          <span
                            className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium"
                            title="Admin Clearance Required"
                          >
                            Restricted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
