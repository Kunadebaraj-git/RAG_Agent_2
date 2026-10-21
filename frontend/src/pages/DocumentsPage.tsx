import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, listDocuments, deleteDocument } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Document {
  id: string;
  filename: string;
  page_count: number;
  chunk_count: number;
  status: 'processing' | 'indexed' | 'failed';
  error: string | null;
  created_at: string;
}

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchDocuments = useCallback(async () => {
    try {
      const { data } = await listDocuments();
      setDocuments(data.documents);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        addToast('Failed to load documents', 'error');
      }
    }
  }, [addToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing documents
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (hasProcessing) {
      pollingRef.current = setInterval(fetchDocuments, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [documents, fetchDocuments]);

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      addToast('Only PDF files are allowed', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('File too large. Maximum size is 10MB', 'error');
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      addToast(`"${file.name}" uploaded successfully`, 'success');
      fetchDocuments();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Upload failed';
      addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      addToast('Document deleted', 'success');
    } catch {
      addToast('Failed to delete document', 'error');
    }
    setDeleteConfirm(null);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      processing: { bg: 'rgba(253,203,110,0.15)', text: 'var(--warning)' },
      indexed: { bg: 'rgba(0,206,201,0.15)', text: 'var(--success)' },
      failed: { bg: 'rgba(255,107,107,0.15)', text: 'var(--danger)' },
    };
    const s = styles[status] || styles.processing;
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ background: s.bg, color: s.text }}
      >
        {status === 'processing' ? '⟳ Processing' : status === 'indexed' ? '✓ Indexed' : '✕ Failed'}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <h1
          onClick={() => navigate('/documents')}
          className="text-xl font-bold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          DocMind AI
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-md" style={{ background: 'var(--bg-card)', color: 'var(--accent-light)', border: '1px solid var(--border)' }}>
            ⚡ {documents.filter(d => d.status === 'indexed').length} Indexed Doc{documents.filter(d => d.status === 'indexed').length === 1 ? '' : 's'}
          </span>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', color: '#fff' }}
          >
            💬 Open Chat & Ask RAG
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Upload Area */}
        <div
          className="rounded-xl p-8 mb-8 text-center cursor-pointer transition-all duration-300"
          style={{
            background: dragActive ? 'var(--bg-hover)' : 'var(--bg-card)',
            border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: dragActive ? '0 0 30px var(--accent-glow)' : 'none',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
          <div className="text-4xl mb-3">📄</div>
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Uploading...' : dragActive ? 'Drop your PDF here' : 'Drag & drop a PDF or click to browse'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Max 10MB, 60 pages. Text-based PDFs only.
          </p>
        </div>

        {/* Documents List */}
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Documents</h2>

        {documents.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-5xl mb-4">📚</div>
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No documents yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload a PDF above to get started. Once indexed, you can chat with it.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:translate-y-[-1px]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.filename}</span>
                    {statusBadge(doc.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{doc.page_count} pages</span>
                    <span>{doc.chunk_count} chunks</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                  {doc.error && (
                    <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{doc.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {doc.status === 'indexed' && (
                    <button
                      onClick={() => navigate('/chat')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      Chat
                    </button>
                  )}
                  {deleteConfirm === doc.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: 'var(--danger)', color: '#fff' }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                      style={{ background: 'rgba(255,107,107,0.1)', color: 'var(--danger)' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentsPage;
