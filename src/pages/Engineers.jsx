import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const CAN_CREATE = ['service_desk', 'admin', 'recruiter'];

export default function Engineers() {
  const { token, user } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: '', skill: '', available_only: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [assignmentsFor, setAssignmentsFor] = useState(null);

  function load() {
    setLoading(true);
    api.listEngineers(token, filters).then((res) => setEngineers(res.engineers || [])).finally(() => setLoading(false));
  }

  useEffect(load, [token, filters.location, filters.skill, filters.available_only]);

  async function toggleAvailability(eng) {
    await api.setEngineerAvailability(token, eng.id, !eng.available);
    load();
  }

  return (
    <Layout
      title="Engineers"
      subtitle="Search by location, skill, and availability — cheapest match first."
      actions={
        CAN_CREATE.includes(user?.role) && (
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Add engineer</button>
        )
      }
    >
      <div className="toolbar">
        <div className="filter-row">
          <input placeholder="Location…" value={filters.location} onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))} />
          <input placeholder="Skill…" value={filters.skill} onChange={(e) => setFilters((f) => ({ ...f, skill: e.target.value }))} />
          <select value={filters.available_only} onChange={(e) => setFilters((f) => ({ ...f, available_only: e.target.value }))}>
            <option value="">All engineers</option>
            <option value="true">Available only</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : engineers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No engineers match</div>
              Try a different filter, or add an engineer.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Location</th><th>Skills</th><th>Rate</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {engineers.map((e) => (
                  <tr key={e.id}>
                    <td className="id-cell">{e.id}</td>
                    <td>{e.name}</td>
                    <td>{e.location || '—'}</td>
                    <td>
                      <div className="chip-row">
                        {(e.skills || []).map((s) => <span className="chip" key={s}>{s}</span>)}
                      </div>
                    </td>
                    <td>{e.hourly_rate ? `${e.hourly_rate} ${e.currency}/hr` : e.day_rate ? `${e.day_rate} ${e.currency}/day` : '—'}</td>
                    <td>
                      <span className="pill" style={{
                        background: e.available ? 'color-mix(in srgb, var(--status-paid) 14%, white)' : 'var(--surface-sunken)',
                        color: e.available ? 'var(--status-paid)' : 'var(--ink-soft)',
                      }}>
                        <span className="pill-dot" style={{ background: e.available ? 'var(--status-paid)' : 'var(--ink-faint)' }} />
                        {e.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleAvailability(e)}>
                          Mark {e.available ? 'unavailable' : 'available'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAssignmentsFor(e)}>Projects</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateEngineerModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}

      {assignmentsFor && (
        <AssignmentsModal token={token} engineer={assignmentsFor} onClose={() => setAssignmentsFor(null)} />
      )}
    </Layout>
  );
}

function AssignmentsModal({ token, engineer, onClose }) {
  const [assignments, setAssignments] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.listAssignments(token, engineer.id).then((res) => setAssignments(res.assignments || []));
  }
  useEffect(load, [token, engineer.id]);

  async function endAssignment(id) {
    try {
      await api.endAssignment(token, id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Modal title={`${engineer.name} — project assignments`} onClose={onClose} width={560}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="btn btn-accent btn-sm" onClick={() => setShowAdd(true)}>+ Assign to project</button>
      </div>
      {assignments.length === 0 ? (
        <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No project assignments yet — this engineer can hold several at once.</div>
      ) : (
        assignments.map((a) => (
          <div key={a.id} className="note" style={{ borderLeftColor: a.active ? 'var(--status-paid)' : 'var(--border)' }}>
            <div className="note-meta">{a.id} · {a.active ? 'Active' : `Ended ${a.end_date}`}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.project_name} — {a.client_name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
              {a.hourly_rate ? `${a.hourly_rate} ${a.currency}/hr` : a.day_rate ? `${a.day_rate} ${a.currency}/day` : 'No rate set'}
              {a.travel_allowance ? ` · travel ${a.travel_allowance}` : ''}
              {a.tools_allowance ? ` · tools ${a.tools_allowance}` : ''}
            </div>
            {a.active && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => endAssignment(a.id)}>End assignment</button>
            )}
          </div>
        ))
      )}

      {showAdd && (
        <AddAssignmentModal
          token={token}
          engineer={engineer}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}
    </Modal>
  );
}

function AddAssignmentModal({ token, engineer, onClose, onCreated }) {
  const [form, setForm] = useState({
    project_name: '', client_name: '', hourly_rate: '', day_rate: '', currency: 'EUR',
    travel_allowance: '', tools_allowance: '', start_date: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createAssignment(token, engineer.id, {
        ...form,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : 0,
        day_rate: form.day_rate ? Number(form.day_rate) : 0,
        travel_allowance: form.travel_allowance ? Number(form.travel_allowance) : 0,
        tools_allowance: form.tools_allowance ? Number(form.tools_allowance) : 0,
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Assign to new project" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Project</label><input required value={form.project_name} onChange={set('project_name')} /></div>
          <div className="field"><label>Client</label><input required value={form.client_name} onChange={set('client_name')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Hourly rate</label><input type="number" value={form.hourly_rate} onChange={set('hourly_rate')} /></div>
          <div className="field"><label>Day rate</label><input type="number" value={form.day_rate} onChange={set('day_rate')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Travel allowance</label><input type="number" value={form.travel_allowance} onChange={set('travel_allowance')} /></div>
          <div className="field"><label>Tools allowance</label><input type="number" value={form.tools_allowance} onChange={set('tools_allowance')} /></div>
        </div>
        <div className="field"><label>Start date</label><input required type="date" value={form.start_date} onChange={set('start_date')} /></div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Assigning…' : 'Assign to project'}
        </button>
      </form>
    </Modal>
  );
}

function CreateEngineerModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '', skills: '', hourly_rate: '', half_day_rate: '', day_rate: '', currency: 'EUR',
    travel_cost: '', resume_url: '', area_coverage: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createEngineer(token, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : 0,
        half_day_rate: form.half_day_rate ? Number(form.half_day_rate) : 0,
        day_rate: form.day_rate ? Number(form.day_rate) : 0,
        currency: form.currency,
        travel_cost: form.travel_cost ? Number(form.travel_cost) : 0,
        resume_url: form.resume_url,
        area_coverage: form.area_coverage.split(',').map((s) => s.trim()).filter(Boolean),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add engineer" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={set('email')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Location</label><input value={form.location} onChange={set('location')} placeholder="Berlin" /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
        </div>
        <div className="field">
          <label>Skills (comma separated)</label>
          <input value={form.skills} onChange={set('skills')} placeholder="Windows, Networking, POS" />
        </div>
        <div className="field">
          <label>Area coverage (comma separated cities)</label>
          <input value={form.area_coverage} onChange={set('area_coverage')} placeholder="Berlin, Munich, Hamburg" />
        </div>
        <div className="field-row">
          <div className="field"><label>Hourly rate</label><input type="number" value={form.hourly_rate} onChange={set('hourly_rate')} /></div>
          <div className="field"><label>Half-day rate</label><input type="number" value={form.half_day_rate} onChange={set('half_day_rate')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Day rate</label><input type="number" value={form.day_rate} onChange={set('day_rate')} /></div>
          <div className="field"><label>Travel cost</label><input type="number" value={form.travel_cost} onChange={set('travel_cost')} /></div>
        </div>
        <div className="field">
          <label>Currency</label>
          <select value={form.currency} onChange={set('currency')}>
            <option>EUR</option><option>GBP</option><option>USD</option><option>PKR</option>
          </select>
        </div>
        <div className="field">
          <label>Resume URL</label>
          <input value={form.resume_url} onChange={set('resume_url')} placeholder="https://…" />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add engineer'}
        </button>
      </form>
    </Modal>
  );
}
