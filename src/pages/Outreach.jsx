import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const STATUS_COLORS = {
  Sent: 'var(--status-assigned)',
  Replied: 'var(--status-onsite)',
  Interested: 'var(--status-paid)',
  'Not Interested': 'var(--ink-faint)',
  'No Response': 'var(--danger)',
};

export default function Outreach() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  function load() {
    setLoading(true);
    api.listOutreach(token, { status: statusFilter }).then((res) => setContacts(res.outreach || [])).finally(() => setLoading(false));
  }
  useEffect(load, [token, statusFilter]);

  const needsFollowUp = contacts.filter((c) => c.needs_follow_up);

  return (
    <Layout
      title="Outreach"
      subtitle="LinkedIn and manual candidate outreach — logged by you, since LinkedIn has no status API."
      actions={<button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Log outreach</button>}
    >
      {needsFollowUp.length > 0 && (
        <div className="banner banner-error">
          {needsFollowUp.length} contact{needsFollowUp.length === 1 ? '' : 's'} sent 3+ days ago with no reply logged yet — follow up: {needsFollowUp.map((c) => c.name).join(', ')}
        </div>
      )}

      <div className="toolbar">
        <div className="filter-row">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : contacts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No outreach logged yet</div>
              Every time you message someone on LinkedIn, log it here to track follow-ups.
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Target role</th><th>Sent</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="clickable" onClick={() => setSelected(c)}>
                    <td>
                      {c.name}
                      {c.needs_follow_up && <span className="chip" style={{ marginLeft: 8, color: 'var(--danger)', borderColor: 'var(--danger)' }}>Follow up</span>}
                    </td>
                    <td>{c.target_role || '—'}</td>
                    <td>{new Date(c.message_sent_at).toLocaleDateString()}</td>
                    <td><StatusPill label={c.status} color={STATUS_COLORS[c.status] || 'var(--ink-faint)'} /></td>
                    <td>
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" onClick={(e) => e.stopPropagation()}>
                          Open LinkedIn
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateOutreachModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}

      {selected && (
        <OutreachDetailModal
          token={token}
          contact={selected}
          onClose={() => setSelected(null)}
          onUpdated={(c) => { setSelected(c); load(); }}
        />
      )}
    </Layout>
  );
}

function CreateOutreachModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', linkedin_url: '', target_role: '', message_sent_at: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createOutreach(token, {
        ...form,
        message_sent_at: new Date(form.message_sent_at).toISOString(),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Log LinkedIn outreach" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input required value={form.name} onChange={set('name')} placeholder="Ahmed Khan" />
        </div>
        <div className="field">
          <label>LinkedIn profile URL</label>
          <input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Target role</label>
            <input value={form.target_role} onChange={set('target_role')} placeholder="Field Engineer" />
          </div>
          <div className="field">
            <label>Message sent on</label>
            <input required type="date" value={form.message_sent_at} onChange={set('message_sent_at')} />
          </div>
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Logging…' : 'Log outreach'}
        </button>
      </form>
    </Modal>
  );
}

function OutreachDetailModal({ token, contact, onClose, onUpdated }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function setStatus(status) {
    try {
      const updated = await api.updateOutreachStatus(token, contact.id, status);
      onUpdated({ ...updated, needs_follow_up: false });
    } catch (e) {
      setError(e.message);
    }
  }

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      const updated = await api.addOutreachNote(token, contact.id, note);
      setNote('');
      onUpdated({ ...updated, needs_follow_up: contact.needs_follow_up });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={contact.name} onClose={onClose} width={520}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>
        {contact.target_role || 'No target role set'} · sent {new Date(contact.message_sent_at).toLocaleDateString()}
      </div>
      {contact.linkedin_url && (
        <a href={contact.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)' }}>
          {contact.linkedin_url}
        </a>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '16px 0' }}>
        {Object.keys(STATUS_COLORS).map((s) => (
          <button
            key={s}
            className="btn btn-sm"
            style={{
              background: contact.status === s ? STATUS_COLORS[s] : 'var(--surface-sunken)',
              color: contact.status === s ? 'white' : 'var(--ink)',
              border: '1px solid var(--border)',
            }}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>Follow-up log</div>
      <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
        {(contact.notes || []).length === 0 ? (
          <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No notes yet.</div>
        ) : (
          contact.notes.map((n, i) => (
            <div key={i} className="note">
              <div className="note-meta">{new Date(n.created_at).toLocaleString()}</div>
              <div style={{ fontSize: 13.5 }}>{n.text}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={addNote} style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}
          value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log a follow-up…" />
        <button className="btn btn-primary btn-sm" disabled={busy}>Add</button>
      </form>
    </Modal>
  );
}
