import React, { useState } from 'react';
import { X, Briefcase, Plus, AlertCircle } from 'lucide-react';
import { api } from '../api/client.ts';
import { Project } from '../types/index.ts';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }: NewProjectModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [status, setStatus] = useState('Active');
  const [progress, setProgress] = useState(10);
  const [budget, setBudget] = useState(150000);
  const [actualSpent, setActualSpent] = useState(25000);
  const [lead, setLead] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const generatedCode = code.trim() || `PROJ-${name.trim().substring(0, 6).toUpperCase().replace(/\s+/g, '')}`;

      await api.createProject({
        code: generatedCode,
        name: name.trim(),
        scope: scope.trim(),
        department,
        status,
        progress: Number(progress) || 0,
        budget: Number(budget) || 0,
        actual_spent: Number(actualSpent) || 0,
        lead: lead.trim() || 'Unassigned'
      });

      onProjectCreated();
      onClose();
      setCode('');
      setName('');
      setScope('');
      setLead('');
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Briefcase size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Project Record</h3>
              <p className="text-xs text-slate-500">Indexes project into portfolio and SQLite database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Project Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. PROJ-AIAPP"
                  className="form-control text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="form-control text-xs"
                >
                  <option>Engineering</option>
                  <option>Finance</option>
                  <option>HR</option>
                  <option>Legal</option>
                  <option>Operations</option>
                  <option>IT</option>
                  <option>Sales</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Enterprise Knowledge Engine 2.0"
                className="form-control text-xs"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scope & Objectives</label>
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Summary of project goals, deliverables and scope..."
                rows={2}
                className="form-control text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-control text-xs"
                >
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Progress ({progress}%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="form-control text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Lead</label>
                <input
                  type="text"
                  value={lead}
                  onChange={(e) => setLead(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="form-control text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Budget Allocation ($)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="form-control text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Spent ($)</label>
                <input
                  type="number"
                  value={actualSpent}
                  onChange={(e) => setActualSpent(Number(e.target.value))}
                  className="form-control text-xs"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-xs"
            >
              {submitting ? 'Creating Project...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
