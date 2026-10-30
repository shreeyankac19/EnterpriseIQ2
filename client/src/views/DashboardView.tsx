import React, { useState, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
  UploadCloud,
  Layers,
  Shield,
  Eye,
  ArrowRight
} from 'lucide-react';
import StatCard from '../components/StatCard.tsx';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DocumentItem, DeptDistribution } from '../types/index.ts';

interface DashboardViewProps {
  onOpenUpload: () => void;
  onOpenAssistant: () => void;
  onSelectDoc: (id: string) => void;
}

export default function DashboardView({ onOpenUpload, onOpenAssistant, onSelectDoc }: DashboardViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 16, active: 6, completed: 5, pending: 5 });
  const [deptDistribution, setDeptDistribution] = useState<DeptDistribution[]>([]);
  const [docsStats, setDocsStats] = useState({
    total: 7,
    byFormat: { CSV: 2, DOCX: 2, PDF: 2, XLSX: 1 } as Record<string, number>,
    byClearance: { Confidential: 3, Internal: 4 } as Record<string, number>
  });
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, statsRes, docsRes] = await Promise.all([
        api.getProjectsAnalytics(),
        api.getDocsStats(),
        api.getDocuments({ role: user?.role || 'admin' })
      ]);

      if (analyticsRes.kpis) setKpis(analyticsRes.kpis);
      if (analyticsRes.departmentDistribution) setDeptDistribution(analyticsRes.departmentDistribution);
      if (statsRes) setDocsStats(statsRes);
      if (docsRes.documents) setRecentDocs(docsRes.documents.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Top Welcome Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Knowledge Intelligence</h2>
          <p className="page-subtitle">
            Welcome back, {user?.name || 'Eleanor Vance'}. System synchronized with SQLite database.
          </p>
        </div>

        <div className="flex gap-2.5">
          <button className="btn btn-secondary text-xs" onClick={onOpenAssistant}>
            <Sparkles size={16} className="text-indigo-600" />
            <span>Ask AI Assistant</span>
          </button>
          <button className="btn btn-primary text-xs" onClick={onOpenUpload}>
            <UploadCloud size={16} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <StatCard
          label="Total Indexed Documents"
          value={loading ? '...' : docsStats.total}
          subtext="PDF, DOCX, CSV, Excel"
          icon={FileText}
          theme="purple"
        />

        <StatCard
          label="Active Projects"
          value={loading ? '...' : kpis.active}
          subtext="In execution or progress"
          icon={TrendingUp}
          theme="sky"
        />

        <StatCard
          label="Completed Projects"
          value={loading ? '...' : kpis.completed}
          subtext="Delivered & audited"
          icon={CheckCircle2}
          theme="emerald"
        />

        <StatCard
          label="Pending Projects"
          value={loading ? '...' : kpis.pending}
          subtext="On hold or scoping"
          icon={Clock}
          theme="amber"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="analytics-grid">
        {/* Left: Department-Wise Project & Budget Distribution */}
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">
              <Briefcase size={18} className="text-indigo-600" />
              <span>Department-Wise Project & Budget Distribution</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Live SQLite Records</span>
          </div>

          <div className="dept-bars-list">
            {deptDistribution.map((item) => (
              <div key={item.department} className="dept-bar-item">
                <div className="dept-bar-header">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.department}</span>
                    <span className="text-xs text-slate-400">
                      {item.projectCount} projects • {item.docCount} docs
                    </span>
                  </div>
                  <span className="font-bold text-indigo-600 text-xs">
                    {item.formattedSpent} <span className="text-slate-400 font-normal">/ {item.formattedBudget}</span>
                  </span>
                </div>

                <div className="dept-bar-track">
                  <div
                    className="dept-bar-fill-completed"
                    style={{ width: `${item.completedPct}%` }}
                    title={`Completed: ${item.completedPct}%`}
                  />
                  <div
                    className="dept-bar-fill-active"
                    style={{ width: `${item.activePct}%` }}
                    title={`Active: ${item.activePct}%`}
                  />
                  <div
                    className="dept-bar-fill-pending"
                    style={{ width: `${item.pendingPct}%` }}
                    title={`Pending: ${item.pendingPct}%`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
              <span>Active / In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              <span>Pending / On Hold</span>
            </div>
          </div>
        </div>

        {/* Right column: Format Breakdown & Clearance Tiers */}
        <div className="flex flex-col gap-4">
          {/* Format Breakdown Card */}
          <div className="card">
            <div className="card-title-row mb-4">
              <div className="card-title text-sm">
                <Layers size={16} className="text-indigo-600" />
                <span>Document Repository by Format</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="file-badge csv">CSV</span>
                <span className="font-bold text-slate-800 text-base">{docsStats.byFormat.CSV || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="file-badge docx">DOCX</span>
                <span className="font-bold text-slate-800 text-base">{docsStats.byFormat.DOCX || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="file-badge pdf">PDF</span>
                <span className="font-bold text-slate-800 text-base">{docsStats.byFormat.PDF || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="file-badge xlsx">XLSX</span>
                <span className="font-bold text-slate-800 text-base">{docsStats.byFormat.XLSX || 0}</span>
              </div>
            </div>
          </div>

          {/* Security Clearance Tiers Card */}
          <div className="card">
            <div className="card-title-row mb-4">
              <div className="card-title text-sm">
                <Shield size={16} className="text-indigo-600" />
                <span>Security Clearance Tiers</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="conf-badge confidential">Confidential</span>
                <span className="text-xs font-bold text-slate-700">
                  {docsStats.byClearance.Confidential || 0} files
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="conf-badge internal">Internal</span>
                <span className="text-xs font-bold text-slate-700">
                  {docsStats.byClearance.Internal || 0} files
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Indexed Company Documents */}
      <div className="card mt-6">
        <div className="card-title-row mb-4">
          <div className="card-title">
            <FileText size={18} className="text-indigo-600" />
            <span>Recent Indexed Company Documents</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Showing latest indexed files</span>
        </div>

        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Document Details</th>
                <th>Type</th>
                <th>Department</th>
                <th>Confidentiality</th>
                <th>Size</th>
                <th>Content Length</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="font-bold text-slate-900 text-xs">{doc.title}</div>
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
                  <td>
                    <button
                      onClick={() => onSelectDoc(doc.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-all"
                    >
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
