import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  FileText, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  FileCode, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export function KnowledgeHub() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [error, setError] = useState(null);

  // Q&A State
  const [question, setQuestion] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaResult, setQaResult] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDocuments();
      setDocuments(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      await api.uploadDocument(file);
      await loadDocuments();
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Delete document '${filename}' and all its extracted chunks?`)) return;
    try {
      await api.deleteDocument(id);
      await loadDocuments();
      if (qaResult) setQaResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePreview = async (id) => {
    try {
      const res = await api.getDocument(id);
      setSelectedDocForPreview(res.data);
    } catch (err) {
      setError(`Failed to fetch preview: ${err.message}`);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      setAsking(true);
      setError(null);
      const res = await api.askQuestion({
        question: question.trim(),
        documentId: selectedDocId ? Number(selectedDocId) : null,
        topK: 3
      });
      setQaResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Alert if any */}
      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Grid: Documents on left, Q&A on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
        
        {/* Left Column: Document Repository */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--accent-blue)" />
                <h3 className="card-title">Document Repository</h3>
              </div>
              <button 
                onClick={loadDocuments} 
                className="btn-secondary btn-sm"
                title="Refresh Documents"
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
            </div>

            {/* Upload Zone */}
            <label
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                display: 'block',
                cursor: uploading ? 'not-allowed' : 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                marginBottom: '1rem',
                transition: 'border-color 0.15s'
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <Upload size={24} color="var(--accent-violet)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                {uploading ? 'Processing & Chunking...' : 'Upload Document'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Supports PDF, TXT, and Markdown (.md)
              </div>
            </label>

            {/* Documents List */}
            {loading ? (
              <div className="empty-state">Loading document index...</div>
            ) : documents.length === 0 ? (
              <div className="empty-state">
                <FileCode size={32} className="empty-state-icon" />
                <div>No documents uploaded yet.</div>
                <div style={{ fontSize: '0.75rem' }}>Upload a file above to begin semantic retrieval.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.filename}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span className="badge badge-info">{doc.file_type.toUpperCase()}</span>
                        <span>{doc.chunk_count} chunk(s)</span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => handlePreview(doc.id)}
                        className="btn-secondary btn-sm"
                        title="Inspect Chunks"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        className="btn-danger btn-sm"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grounded Q&A Interface */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={18} color="var(--accent-violet)" />
                <h3 className="card-title">Grounded Knowledge Q&A</h3>
              </div>
              <span className="badge badge-purple">TF-IDF Retriever</span>
            </div>

            <form onSubmit={handleAskQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question grounded in the uploaded documents..."
                    disabled={asking}
                  />
                </div>
                <div style={{ width: '180px' }}>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    disabled={asking}
                  >
                    <option value="">All Documents</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.filename.slice(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={asking || !question.trim()}
                >
                  {asking ? 'Searching...' : 'Ask'}
                </button>
              </div>
            </form>

            {/* Answer Display */}
            {qaResult && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Result Status Banner */}
                {!qaResult.supported ? (
                  <div className="alert alert-warning">
                    <AlertTriangle size={18} />
                    <span><strong>No relevant passages found:</strong> The uploaded documents do not contain matching text for this inquiry.</span>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <CheckCircle2 size={18} />
                    <span>Answer grounded on <strong>{qaResult.retrieved_passages?.length || 0}</strong> retrieved passage(s) from knowledge base.</span>
                  </div>
                )}

                {/* Generated Answer */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-violet)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Generated Answer ({qaResult.provider} mode)
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {qaResult.answer}
                  </div>
                </div>

                {/* Retrieved Source Passages & Citations */}
                <div>
                  <h4 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem', textTransform: 'uppercase' }}>
                    Retrieved Source Passages & TF-IDF Scores
                  </h4>
                  {qaResult.retrieved_passages?.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No passages surpassed the similarity threshold.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {qaResult.retrieved_passages.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.825rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                              Citation [{idx + 1}]: {p.filename || `Document #${p.document_id}`} — Page {p.page_number}
                            </span>
                            <span className="badge badge-success">
                              TF-IDF Score: {p.score}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                            "{p.content}"
                          </div>
                          {p.matched_terms && p.matched_terms.length > 0 && (
                            <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Matched keywords:</span>
                              {p.matched_terms.map((t) => (
                                <span key={t} className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Document Chunks Preview Modal */}
      <Modal
        isOpen={Boolean(selectedDocForPreview)}
        onClose={() => setSelectedDocForPreview(null)}
        title={`Extracted Chunks: ${selectedDocForPreview?.filename}`}
        maxWidth="750px"
      >
        {selectedDocForPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              <span>Total Chunks: <strong>{selectedDocForPreview.chunk_count}</strong></span>
              <span>Characters: <strong>{selectedDocForPreview.char_count}</strong></span>
              <span>Format: <strong>{selectedDocForPreview.file_type.toUpperCase()}</strong></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedDocForPreview.chunks?.map((chunk) => (
                <div
                  key={chunk.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>
                      Chunk #{chunk.chunk_index + 1} (Page {chunk.page_number})
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      ~{chunk.token_count} tokens
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {chunk.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default KnowledgeHub;
