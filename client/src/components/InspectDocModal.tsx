import React, { useState, useEffect } from 'react';
import { X, FileText, Layers, Calendar, User, HardDrive, Trash2, Shield, Eye } from 'lucide-react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DocumentItem, DocumentChunk } from '../types/index.ts';

interface InspectDocModalProps {
  docId: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function InspectDocModal({ docId, onClose, onDeleted }: InspectDocModalProps) {
  const { user } = useAuth();
  const [doc, setDoc] = useState<(DocumentItem & { raw_text: string }) | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chunks' | 'raw'>('chunks');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (docId) {
      setLoading(true);
      api.getDocumentDetails(docId)
        .then(res => {
          setDoc(res.document);
          setChunks(res.chunks || []);
        })
        .catch(err => {
          console.error('Failed to load document details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDoc(null);
      setChunks([]);
    }
  }, [docId]);

  if (!docId) return null;

  const handleDelete = async () => {
    if (!docId || !window.confirm('Are you sure you want to delete this document from the knowledge base?')) return;
    try {
      setDeleting(true);
      await api.deleteDocument(docId);
      onDeleted();
      onClose();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-3xl" style={{ maxHeight: '88vh' }}>
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{doc?.title || 'Inspect Document'}</h3>
              <p className="text-xs text-slate-500 font-mono">{doc?.filename}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading vectorized chunks and metadata...
            </div>
          ) : !doc ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Document not found.
            </div>
          ) : (
            <>
              {/* Metadata Badges Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className={`file-badge ${doc.file_type.toLowerCase()} mt-0.5`}>
                    {doc.file_type}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
                  <span className="font-semibold text-slate-800">{doc.department}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Confidentiality</span>
                  <span className={`conf-badge ${doc.confidentiality.toLowerCase()} mt-0.5`}>
                    <Shield size={10} />
                    <span>{doc.confidentiality}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Size & Length</span>
                  <span className="font-semibold text-slate-800">{doc.formatted_size} • {doc.content_length_desc}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
                <button
                  onClick={() => setActiveTab('chunks')}
                  className={`pb-2 border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'chunks'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Layers size={14} />
                  <span>Vector Index Chunks ({chunks.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('raw')}
                  className={`pb-2 border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'raw'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText size={14} />
                  <span>Parsed Plain Text</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="max-h-96 overflow-y-auto">
                {activeTab === 'chunks' ? (
                  <div className="space-y-3">
                    {chunks.map((chk) => (
                      <div
                        key={chk.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                          <span>Chunk #{chk.chunk_index} • Page {chk.page_number}</span>
                          <span>{chk.token_count} tokens</span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {chk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {doc.raw_text}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {user?.role === 'admin' && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-danger text-xs mr-auto flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>{deleting ? 'Deleting...' : 'Delete Document'}</span>
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
