import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../database/db.js';
import { AIService } from './aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage/uploads');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

export class DocumentService {
  static getAllDocuments() {
    return db.prepare(`
      SELECT 
        d.id, 
        d.filename, 
        d.file_type, 
        d.file_size, 
        d.char_count, 
        d.chunk_count, 
        d.status, 
        d.error_message, 
        d.created_at, 
        d.updated_at
      FROM documents d
      ORDER BY d.created_at DESC
    `).all();
  }

  static getDocumentById(id) {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) return null;

    const chunks = db.prepare(`
      SELECT id, chunk_index, content, page_number, token_count
      FROM document_chunks
      WHERE document_id = ?
      ORDER BY chunk_index ASC
    `).all(id);

    return {
      ...doc,
      chunks
    };
  }

  static async processAndSaveDocument(file) {
    const ext = file.originalname.split('.').pop().toLowerCase();
    
    // 1. Initial insert with status 'pending'
    const insertStmt = db.prepare(`
      INSERT INTO documents (filename, file_type, file_size, status)
      VALUES (?, ?, ?, 'pending')
    `);
    const result = insertStmt.run(file.originalname, ext, file.size);
    const documentId = result.lastInsertRowid;

    // 2. Save physical file to storage
    const savedPath = path.join(storageDir, `${documentId}_${file.originalname}`);
    fs.writeFileSync(savedPath, file.buffer);

    try {
      // 3. Request extraction and chunking from Python AI Service
      const extraction = await AIService.extractAndChunk(
        file.buffer,
        file.originalname,
        documentId
      );

      // 4. Save chunks in SQLite transaction
      const insertChunk = db.prepare(`
        INSERT INTO document_chunks (document_id, chunk_index, content, page_number, token_count)
        VALUES (?, ?, ?, ?, ?)
      `);

      const saveChunksTx = db.transaction((chunks) => {
        for (const chunk of chunks) {
          insertChunk.run(
            documentId,
            chunk.chunk_index,
            chunk.content,
            chunk.page_number || 1,
            chunk.token_count || 0
          );
        }
      });

      saveChunksTx(extraction.chunks);

      // 5. Update document status to 'processed'
      db.prepare(`
        UPDATE documents 
        SET 
          status = 'processed', 
          char_count = ?, 
          chunk_count = ?, 
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(extraction.char_count, extraction.chunk_count, documentId);

      return this.getDocumentById(documentId);

    } catch (err) {
      // Mark document as failed
      db.prepare(`
        UPDATE documents 
        SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(err.message, documentId);

      throw err;
    }
  }

  static deleteDocument(id) {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) return false;

    // Remove physical file if it exists
    const filePath = path.join(storageDir, `${id}_${doc.filename}`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error(`Failed to delete file on disk: ${e.message}`);
      }
    }

    // Delete record (cascading deletes document_chunks)
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return true;
  }

  static getAllChunks(documentId = null) {
    if (documentId) {
      return db.prepare(`
        SELECT id, document_id, chunk_index, content, page_number, token_count
        FROM document_chunks
        WHERE document_id = ?
        ORDER BY chunk_index ASC
      `).all(documentId);
    }
    return db.prepare(`
      SELECT id, document_id, chunk_index, content, page_number, token_count
      FROM document_chunks
      ORDER BY document_id, chunk_index ASC
    `).all();
  }
}
