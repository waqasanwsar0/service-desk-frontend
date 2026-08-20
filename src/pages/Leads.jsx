import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const STAGES = ['New', 'Contacted', 'Follow-up', 'Qualified', 'Meeting Scheduled', 'Won', 'Lost'];

const STAGE_COLORS = {
  New: 'var(--status-new)',
  Contacted: 'var(--status-assigned)',
  'Follow-up': 'var(--status-onsite)',
  Qualified: 'var(--status-timesheet)',
  'Meeting Scheduled': 'var(--status-invoice)',
  Won: 'var(--status-paid)',
  Lost: 'var(--danger)',
};

export default function Leads() {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  function load() {
    setLoading(true);
    api.listLeads(token).then((res) => setLeads(res.leads || [])).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  return (
    <Layout
      title="Sales CRM"
      subtitle="Business-development leads — from LinkedIn or anywhere else — tracked through a sales pipeline."
      actions={<button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Add lead</button>}
    >
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {STAGES.map((stage) => (
            <div key={stage} style={{ minWidth: 210, flex: '0 0 210px' }}>
              <div className="section-title" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>{stage}</span>
                <span style={{ color: 'var(--ink-faint)' }}>{leads.filter((l) => l.status === stage).length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leads.filter((l) => l.status === stage).map((l) => (
                  <div key={l.id} className="card card-pad" style={{ cursor: 'pointer', borderLeft: `3px solid ${STAGE_COLORS[stage]}` }} onClick={() => setSelected(l)}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.company_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{l.contact_name || '—'}</div>
                  </div>
                ))}
                {leads.filter((l) => l.status === stage).length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '8px 2px' }}>Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateLeadModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
      {selected && (
        <LeadDetailModal token={token} lead={selected} onClose={() => setSelected(null)} onUpdated={(l) => { setSelected(l); load(); }} />
      )}
    </Layout>
  );
}

function CreateLeadModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ company_name: '', contact_name: '', contact_email: '', linkedin_url: '', source: 'LinkedIn' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createLead(token, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add lead" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Company</label><input required value={form.company_name} onChange={set('company_name')} /></div>
        <div className="field-row">
          <div className="field"><label>Contact name</label><input value={form.contact_name} onChange={set('contact_name')} /></div>
          <div className="field"><label>Contact email</label><input type="email" value={form.contact_email} onChange={set('contact_email')} /></div>
        </div>
        <div className="field"><label>LinkedIn URL</label><input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" /></div>
        <div className="field"><label>Source</label><input value={form.source} onChange={set('source')} placeholder="LinkedIn" /></div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add lead'}
        </button>
      </form>
    </Modal>
  );
}

function LeadDetailModal({ token, lead, onClose, onUpdated }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function setStatus(stage) {
    try {
      const updated = await api.updateLeadStatus(token, lead.id, stage);
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
      const updated = await api.addLeadNote(token, lead.id, note);
      setNote('');
      onUpdated(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={lead.company_name} onClose={onClose} width={520}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
        {lead.contact_name || 'No contact name'} {lead.contact_email ? `· ${lead.contact_email}` : ''}
      </div>
      {lead.linkedin_url && (
        <a href={lead.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)', display: 'block', marginBottom: 12 }}>
          {lead.linkedin_url}
        </a>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {STAGES.map((s) => (
          <button
            key={s}
            className="btn btn-sm"
            style={{
              background: lead.status === s ? STAGE_COLORS[s] : 'var(--surface-sunken)',
              color: lead.status === s ? 'white' : 'var(--ink)',
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
        {(lead.notes || []).length === 0 ? (
          <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No notes yet.</div>
        ) : (
          lead.notes.map((n, i) => (
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
