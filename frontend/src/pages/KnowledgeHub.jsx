import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  FileCode, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  Bookmark,
  Layers
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

  const handleAskQuestion = async (customQ) => {
    const queryText = (typeof customQ === 'string' ? customQ : question).trim();
    if (!queryText) return;

    if (typeof customQ === 'string') {
      setQuestion(customQ);
    }

    try {
      setAsking(true);
      setError(null);
      const res = await api.askQuestion({
        question: queryText,
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

  const sampleQueries = [
    { label: 'Retrieval Method', q: 'What retrieval method does ORBIT AI use?' },
    { label: 'About ORBIT AI', q: 'What is ORBIT AI?' },
    { label: 'Agent Tools', q: 'What tools are available in the Agent Playground?' },
    { label: 'Mars Test (Out of domain)', q: 'What is the current population of Mars?' }
  ];

  return (
    <div className="page-container">
      {/* Top Banner Alert if any */}
      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ wordBreak: 'break-word' }}>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        
        {/* Left Column: Document Repository */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <FileText size={18} color="var(--accent-blue)" />
                <div>
                  <h3 className="card-title">Document Repository</h3>
                  <p className="card-subtitle">Local storage & chunked corpus</p>
                </div>
              </div>
              <button 
                onClick={loadDocuments} 
                className="btn-secondary btn-sm"
                title="Refresh Documents"
                disabled={loading}
              >
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
              </button>
            </div>

            {/* Upload Zone */}
            <label
              style={{
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '1.75rem 1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                marginBottom: '1.25rem',
                transition: 'all var(--transition-normal)'
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
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  color: 'var(--accent-violet-light)'
                }}
              >
                <Upload size={20} className={uploading ? 'spin' : ''} />
              </div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                {uploading ? 'Parsing & Chunking File...' : 'Upload Document'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PDF, TXT, or Markdown (.md)
              </div>
            </label>

            {/* Documents List */}
            {loading ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <RefreshCw size={24} className="spin empty-state-icon" />
                <div className="empty-state-title">Loading documents...</div>
              </div>
            ) : documents.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <FileCode size={32} className="empty-state-icon" />
                <div className="empty-state-title">No documents uploaded</div>
                <div className="empty-state-desc">Upload a document above to begin TF-IDF retrieval.</div>
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
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(11, 17, 32, 0.6)',
                      border: '1px solid var(--border-glass)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '0.75rem' }}>
                      <div 
                        style={{ 
                          fontWeight: 600, 
                          fontSize: '0.875rem', 
                          color: '#ffffff', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}
                        title={doc.filename}
                      >
                        {doc.filename}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        <span className="badge badge-info">{doc.file_type.toUpperCase()}</span>
                        <span>{doc.chunk_count} chunk(s)</span>
                        <span>•</span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handlePreview(doc.id)}
                        className="btn-secondary btn-sm"
                        title="Inspect Chunks"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        className="btn-danger btn-sm"
                        title="Delete Document"
                      >
                        <Trash2 size={13} />
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
              <div className="card-title-group">
                <Search size={18} color="var(--accent-violet)" />
                <div>
                  <h3 className="card-title">Grounded Knowledge Q&A</h3>
                  <p className="card-subtitle">Transparent TF-IDF retrieval with verifiable citations</p>
                </div>
              </div>
              <span className="badge badge-purple">
                <Sparkles size={11} /> TF-IDF Keyword Ranking
              </span>
            </div>

            {/* Quick Sample Questions Chips */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
                Try verified questions:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {sampleQueries.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px' }}
                    onClick={() => handleAskQuestion(item.q)}
                    disabled={asking}
                  >
                    <ArrowRight size={11} color="var(--accent-cyan)" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAskQuestion(); }} 
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question grounded in the knowledge base..."
                    disabled={asking}
                  />
                </div>
                <div style={{ flex: '0 1 180px' }}>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    disabled={asking}
                  >
                    <option value="">All Documents</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.filename.length > 20 ? `${d.filename.slice(0, 20)}...` : d.filename}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={asking || !question.trim()}
                  style={{ flexShrink: 0 }}
                >
                  {asking ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Ask
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Answer Display */}
            {qaResult && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.25s ease-out' }}>
                {/* Result Status Banner */}
                {!qaResult.supported ? (
                  <div className="alert alert-warning">
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>No relevant passages found:</strong> The knowledge base does not contain matching text for this inquiry.
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success">
                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.85rem' }}>
                      Answer grounded on <strong>{qaResult.retrieved_passages?.length || 0}</strong> verified passage(s) from document repository.
                    </div>
                  </div>
                )}

                {/* Generated Answer Card */}
                <div
                  style={{
                    backgroundColor: 'rgba(11, 17, 32, 0.7)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: '1px solid var(--border-glass)',
                    boxShadow: 'var(--shadow-glass-card)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--accent-violet-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Extracted Answer ({qaResult.provider} mode)
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      Passages Checked: {qaResult.total_chunks_searched || 4}
                    </span>
                  </div>

                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-main)', fontSize: '0.92rem', wordBreak: 'break-word' }}>
                    {qaResult.answer}
                  </div>
                </div>

                {/* Retrieved Source Passages & Citations */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Bookmark size={14} color="var(--accent-blue-light)" />
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Retrieved Source Passages & Verifiable Citations
                    </h4>
                  </div>

                  {qaResult.retrieved_passages?.length === 0 ? (
                    <div className="glass-panel" style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.825rem' }}>
                      No passages surpassed the relevance threshold.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {qaResult.retrieved_passages.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(11, 17, 32, 0.55)',
                            border: '1px solid var(--border-glass)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-blue-light)' }}>
                              Citation [{idx + 1}]: {p.filename || `Document #${p.document_id}`} — Page {p.page_number} (Chunk #{p.id})
                            </span>
                            <span className="badge badge-success">
                              TF-IDF Score: {p.score}
                            </span>
                          </div>

                          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '0.5rem', wordBreak: 'break-word' }}>
                            "{p.content}"
                          </div>

                          {p.matched_terms && p.matched_terms.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Matched keywords:</span>
                              {p.matched_terms.map((t) => (
                                <span key={t} className="badge badge-purple" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
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
        maxWidth="800px"
      >
        {selectedDocForPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <span>Total Chunks: <strong style={{ color: '#fff' }}>{selectedDocForPreview.chunk_count}</strong></span>
              <span>Characters: <strong style={{ color: '#fff' }}>{selectedDocForPreview.char_count}</strong></span>
              <span>Format: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedDocForPreview.file_type.toUpperCase()}</strong></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedDocForPreview.chunks?.map((chunk) => (
                <div
                  key={chunk.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(11, 17, 32, 0.65)',
                    border: '1px solid var(--border-glass)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-violet-light)' }}>
                      Chunk #{chunk.chunk_index + 1} (Page {chunk.page_number})
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      ~{chunk.token_count} tokens
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', lineHeight: 1.6, wordBreak: 'break-word' }}>
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
