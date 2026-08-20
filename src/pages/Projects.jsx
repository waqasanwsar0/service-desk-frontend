import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const CAN_CREATE = ['service_desk', 'admin'];

export default function Projects() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [dispatchFor, setDispatchFor] = useState(null);

  function load() {
    setLoading(true);
    api.listProjects(token).then((res) => setProjects(res.projects || [])).finally(() => setLoading(false));
    api.listEngineers(token, { available_only: 'true' }).then((res) => setEngineers(res.engineers || []));
  }
  useEffect(load, [token]);

  return (
    <Layout
      title="Projects"
      subtitle="Organized by client, country, city, and type (Dispatch or FTE)."
      actions={
        CAN_CREATE.includes(user?.role) && (
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ New project</button>
        )
      }
    >
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No projects yet</div>
              Create one to organize tickets and engineers by country and city.
            </div>
          ) : (
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Client</th><th>Country</th><th>City</th><th>Type</th><th></th></tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="id-cell">{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.client_name}</td>
                    <td>{p.country || '—'}</td>
                    <td>{p.city || '—'}</td>
                    <td>{p.type}</td>
                    <td>
                      {p.type === 'Dispatch' && CAN_CREATE.includes(user?.role) && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDispatchFor(p)}>+ Dispatch</button>
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
        <CreateProjectModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}

      {dispatchFor && (
        <DispatchModal
          token={token}
          project={dispatchFor}
          engineers={engineers}
          onClose={() => setDispatchFor(null)}
          onCreated={() => setDispatchFor(null)}
        />
      )}
    </Layout>
  );
}

function DispatchModal({ token, project, engineers, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', site_address: '', engineer_id: '', priority: 'Medium' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.createDispatch(token, {
        project_id: project.id,
        client_name: project.client_name,
        title: form.title,
        site_address: form.site_address,
        engineer_id: form.engineer_id,
        priority: form.priority,
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <Modal title="Dispatch created" onClose={onCreated}>
        <div className="banner banner-info">
          Ticket <strong>{result.ticket?.id}</strong> was generated automatically and
          {form.engineer_id ? ' assigned to the selected engineer.' : ' is waiting for assignment.'}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onCreated}>Done</button>
      </Modal>
    );
  }

  return (
    <Modal title={`Dispatch — ${project.name}`} onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
        Creates a ticket automatically for this project and (if an engineer is picked) assigns it right away.
      </div>
      <form onSubmit={submit}>
        <div className="field"><label>What's needed</label><input required value={form.title} onChange={set('title')} placeholder="Router install" /></div>
        <div className="field"><label>Site address</label><input value={form.site_address} onChange={set('site_address')} /></div>
        <div className="field">
          <label>Assign engineer (optional — shares with available engineers if left blank)</label>
          <select value={form.engineer_id} onChange={set('engineer_id')}>
            <option value="">Leave unassigned</option>
            {engineers.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.location}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Priority</label>
          <select value={form.priority} onChange={set('priority')}>
            <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
          </select>
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Dispatching…' : 'Dispatch'}
        </button>
      </form>
    </Modal>
  );
}

function CreateProjectModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', client_name: '', country: '', city: '', type: 'Dispatch' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createProject(token, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Name</label><input required value={form.name} onChange={set('name')} placeholder="Viora Rollout" /></div>
          <div className="field"><label>Client</label><input required value={form.client_name} onChange={set('client_name')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Country</label><input value={form.country} onChange={set('country')} placeholder="Germany" /></div>
          <div className="field"><label>City</label><input value={form.city} onChange={set('city')} placeholder="Berlin" /></div>
        </div>
        <div className="field">
          <label>Type</label>
          <select value={form.type} onChange={set('type')}>
            <option value="Dispatch">Dispatch</option>
            <option value="FTE">FTE</option>
          </select>
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add project'}
        </button>
      </form>
    </Modal>
  );
}
