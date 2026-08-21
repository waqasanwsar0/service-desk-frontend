import { useState } from 'react';
import { uploadFile } from '../api/client';
import { useAuth } from '../context/AuthContext';

// A small file-picker that uploads immediately on selection and hands
// the resulting URL back via onUploaded. Works alongside a plain URL
// text input in most forms — either paste a link or upload a file.
export default function FileUpload({ onUploaded, accept = 'image/*,video/*,application/pdf', label = 'Upload file' }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadedName, setUploadedName] = useState('');

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const result = await uploadFile(token, file);
      setUploadedName(result.filename);
      onUploaded(result.url, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
        {busy ? 'Uploading…' : `⬆ ${label}`}
        <input type="file" accept={accept} onChange={handleChange} disabled={busy} style={{ display: 'none' }} />
      </label>
      {uploadedName && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--status-paid)' }}>✓ {uploadedName}</span>}
      {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{error}</div>}
      <div className="field-hint" style={{ marginTop: 4 }}>Images, videos, and PDFs — up to 20MB.</div>
    </div>
  );
}
