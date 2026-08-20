import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Requirements() {
  const { token } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    setLoading(true);
    api.listRequirements(token).then((res) => setRequirements(res.requirements || [])).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  return (
    <Layout
      title="Client Requirements"
      subtitle="Requirements uploaded by the client — via the portal, or the future email intake."
      actions={<button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Add requirement</button>}
    >
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : requirements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No requirements yet</div>
              Log a client requirement here to turn into tickets or dispatches.
            </div>
          ) : (
            <table>
              <thead><tr><th>ID</th><th>Client</th><th>Title</th><th>Source</th><th>Received</th><th></th></tr></thead>
              <tbody>
                {requirements.map((r) => (
                  <tr key={r.id}>
                    <td className="id-cell">{r.id}</td>
                    <td>{r.client_name}</td>
                    <td>{r.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.source}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View file</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateRequirementModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
    </Layout>
  );
}

function CreateRequirementModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ client_name: '', title: '', description: '', file_url: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createRequirement(token, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add client requirement" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Client</label><input required value={form.client_name} onChange={set('client_name')} /></div>
          <div className="field"><label>Title</label><input required value={form.title} onChange={set('title')} placeholder="Need 5 laptops setup" /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows={3} value={form.description} onChange={set('description')} /></div>
        <div className="field"><label>File URL</label><input value={form.file_url} onChange={set('file_url')} placeholder="https://…" /></div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add requirement'}
        </button>
      </form>
    </Modal>
  );
}
