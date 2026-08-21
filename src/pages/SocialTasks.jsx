import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';
import { api, fileUrl } from '../api/client';

const STATUSES = ['Draft', 'In Review', 'Approved', 'Posted'];
const STATUS_COLORS = {
  Draft: 'var(--status-new)',
  'In Review': 'var(--status-onsite)',
  Approved: 'var(--status-timesheet)',
  Posted: 'var(--status-paid)',
};

export default function SocialTasks() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  function load() {
    setLoading(true);
    api.listSocialTasks(token).then((res) => setTasks(res.tasks || [])).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  return (
    <Layout
      title="Social Media Tasks"
      subtitle="Content calendar — draft, review, approve, and post, tracked per platform."
      actions={<button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ New task</button>}
    >
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {STATUSES.map((status) => (
            <div key={status} style={{ minWidth: 220, flex: '0 0 220px' }}>
              <div className="section-title" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>{status}</span>
                <span style={{ color: 'var(--ink-faint)' }}>{tasks.filter((t) => t.status === status).length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.filter((t) => t.status === status).map((t) => (
                  <div key={t.id} className="card card-pad" style={{ cursor: 'pointer', borderLeft: `3px solid ${STATUS_COLORS[status]}` }} onClick={() => setSelected(t)}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{t.platform} {t.due_date ? `· ${t.due_date}` : ''}</div>
                  </div>
                ))}
                {tasks.filter((t) => t.status === status).length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '8px 2px' }}>Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
      {selected && (
        <TaskDetailModal token={token} task={selected} onClose={() => setSelected(null)} onUpdated={(t) => { setSelected(t); load(); }} />
      )}
    </Layout>
  );
}

function CreateTaskModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', platform: 'Instagram', due_date: '', description: '', asset_url: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createSocialTask(token, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New content task" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Title</label><input required value={form.title} onChange={set('title')} placeholder="Diwali campaign post" /></div>
        <div className="field-row">
          <div className="field">
            <label>Platform</label>
            <select value={form.platform} onChange={set('platform')}>
              <option>Instagram</option><option>Facebook</option><option>LinkedIn</option><option>Twitter/X</option><option>TikTok</option>
            </select>
          </div>
          <div className="field"><label>Due date</label><input type="date" value={form.due_date} onChange={set('due_date')} /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows={2} value={form.description} onChange={set('description')} /></div>
        <div className="field">
          <label>Asset</label>
          <FileUpload label="Upload image/video" onUploaded={(url) => setForm((f) => ({ ...f, asset_url: fileUrl(url) }))} />
          <input style={{ marginTop: 6 }} value={form.asset_url} onChange={set('asset_url')} placeholder="Or paste a URL…" />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add task'}
        </button>
      </form>
    </Modal>
  );
}

function TaskDetailModal({ token, task, onClose, onUpdated }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function setStatus(status) {
    try {
      const updated = await api.updateSocialTaskStatus(token, task.id, status);
      onUpdated(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      const updated = await api.addSocialTaskNote(token, task.id, note);
      setNote('');
      onUpdated(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={task.title} onClose={onClose} width={520}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
        {task.platform} {task.due_date ? `· due ${task.due_date}` : ''}
      </div>
      {task.description && <div style={{ fontSize: 13.5, marginBottom: 12 }}>{task.description}</div>}
      {task.asset_url && (
        <a href={fileUrl(task.asset_url)} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)', display: 'block', marginBottom: 12 }}>
          View asset
        </a>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            className="btn btn-sm"
            style={{
              background: task.status === s ? STATUS_COLORS[s] : 'var(--surface-sunken)',
              color: task.status === s ? 'white' : 'var(--ink)',
              border: '1px solid var(--border)',
            }}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>Notes</div>
      <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
        {(task.notes || []).length === 0 ? (
          <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No notes yet.</div>
        ) : (
          task.notes.map((n, i) => (
            <div key={i} className="note">
              <div className="note-meta">{new Date(n.created_at).toLocaleString()}</div>
              <div style={{ fontSize: 13.5 }}>{n.text}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={addNote} style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}
          value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
        <button className="btn btn-primary btn-sm" disabled={busy}>Add</button>
      </form>
    </Modal>
  );
}
