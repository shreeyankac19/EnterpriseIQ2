import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  User as UserIcon,
  Filter
} from 'lucide-react';
import StatCard from '../components/StatCard.tsx';
import { api } from '../api/client.ts';
import { Project } from '../types/index.ts';

interface ProjectsViewProps {
  onOpenNewProject: () => void;
}

export default function ProjectsView({ onOpenNewProject }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState({ total: 16, active: 6, completed: 5, pending: 5 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  useEffect(() => {
    loadProjects();
  }, [deptFilter, statusFilter, search]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const [projRes, analyticsRes] = await Promise.all([
        api.getProjects({
          dept: deptFilter,
          status: statusFilter,
          search
        }),
        api.getProjectsAnalytics()
      ]);

      setProjects(projRes.projects || []);
      if (analyticsRes.kpis) setKpis(analyticsRes.kpis);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString()}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Project Portfolio & Analytics</h2>
          <p className="page-subtitle">
            Dynamic database metrics, milestone tracking, and cross-departmental expenditures.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewProject}>
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <StatCard
          label="Total Projects"
          value={loading ? '...' : kpis.total}
          subtext="Portfolio size"
          icon={Briefcase}
          theme="purple"
        />

        <StatCard
          label="Active / In Progress"
          value={loading ? '...' : kpis.active}
          subtext="Currently executing"
          icon={TrendingUp}
          theme="sky"
        />

        <StatCard
          label="Completed Projects"
          value={loading ? '...' : kpis.completed}
          subtext="Delivered to date"
          icon={CheckCircle2}
          theme="emerald"
        />

        <StatCard
          label="Pending / On Hold"
          value={loading ? '...' : kpis.pending}
          subtext="Awaiting kickoff/budget"
          icon={Clock}
          theme="amber"
        />
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
              placeholder="Search by code, title, lead, or scope..."
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
                <option>IT</option>
                <option>Sales</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 outline-none"
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>PROJECT NAME & SCOPE</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>PROGRESS</th>
                <th>BUDGET ALLOCATION</th>
                <th>ACTUAL SPENT</th>
                <th>LEAD</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    Loading project records from SQLite database...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    No matching project records found.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const utilizedPct = proj.budget > 0 ? Math.round((proj.actual_spent / proj.budget) * 100) : 0;
                  const isHighSpent = utilizedPct > 90;

                  return (
                    <tr key={proj.id}>
                      <td>
                        <span className="bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] px-2 py-1 rounded tracking-wide border border-indigo-100">
                          {proj.code}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 text-xs">{proj.name}</div>
                        <div className="text-[11px] text-slate-400 max-w-md truncate mt-0.5">
                          {proj.scope}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-700">{proj.department}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${proj.status.toLowerCase()}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td>
                        <div className="w-24">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                            <span>{proj.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                proj.progress === 100
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-slate-900">
                          {formatCurrency(proj.budget)}
                        </span>
                      </td>
                      <td>
                        <div className={`text-xs font-bold ${isHighSpent && proj.progress === 100 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatCurrency(proj.actual_spent)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {utilizedPct}% utilized
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <UserIcon size={13} className="text-slate-400" />
                          <span>{proj.lead}</span>
                        </div>
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
