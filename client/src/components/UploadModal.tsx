import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [confidentiality, setConfidentiality] = useState('Internal');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document file (PDF, DOCX, CSV, or XLSX).');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim() || file.name);
      formData.append('department', department);
      formData.append('confidentiality', confidentiality);
      formData.append('uploaded_by', user?.name || 'Eleanor Vance');

      await api.uploadDocument(formData);
      setSuccess('Document successfully indexed and vectorized!');
      setTimeout(() => {
        onUploadSuccess();
        onClose();
        setFile(null);
        setTitle('');
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Enterprise Document</h3>
              <p className="text-xs text-slate-500">Supports PDF, DOCX, CSV, and XLSX</p>
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

            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center bg-slate-50/50 cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.docx,.csv,.xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud size={32} className="mx-auto text-indigo-600 mb-2" />
              {file ? (
                <div className="text-xs font-semibold text-slate-800">
                  Selected: <span className="text-indigo-600">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-slate-700">
                    Click or drag & drop document file here
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Auto-parsed and indexed into SQLite knowledge graph
                  </div>
                </>
              )}
            </div>

            {/* Document Title */}
            <div className="form-group">
              <label className="form-label">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Executive Strategy Roadmap"
                className="form-control"
                required
              />
            </div>

            {/* Department & Confidentiality row */}
            <div className="grid grid-cols-2 gap-4">
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
                  <option>General</option>
                  <option>IT</option>
                  <option>Sales</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Confidentiality Tier</label>
                <select
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value)}
                  className="form-control text-xs"
                >
                  <option value="Internal">Internal (All Staff)</option>
                  <option value="Confidential">Confidential (Admin Only)</option>
                  <option value="Restricted">Restricted (Executive)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="btn btn-primary text-xs"
            >
              {uploading ? 'Processing & Indexing...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
