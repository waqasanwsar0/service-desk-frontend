import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { stageColor, TICKET_STAGES, PRIORITY_COLORS } from '../lib/stages';

const CAN_CREATE = ['service_desk', 'admin'];

export default function Tickets() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  function load() {
    setLoading(true);
    api
      .listTickets(token, filters)
      .then((res) => setTickets(res.tickets || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token, filters.status, filters.priority]);

  return (
    <Layout
      title="Tickets"
      subtitle="Every request moving through the desk, from intake to paid."
      actions={
        CAN_CREATE.includes(user?.role) && (
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
            + New ticket
          </button>
        )
      }
    >
      <div className="toolbar">
        <div className="filter-row">
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            {TICKET_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
            <option value="">All priorities</option>
            {Object.keys(PRIORITY_COLORS).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No tickets match</div>
              Try clearing filters, or create a new ticket.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Engineer</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="clickable" onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td className="id-cell">{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.client_name}</td>
                    <td>{t.assigned_engineer_name || '—'}</td>
                    <td>
                      <StatusPill label={t.priority} color={PRIORITY_COLORS[t.priority] || 'var(--ink-faint)'} />
                    </td>
                    <td>
                      <StatusPill label={t.status} color={stageColor(t.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateTicketModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={(t) => {
            setShowCreate(false);
            navigate(`/tickets/${t.id}`);
          }}
        />
      )}
    </Layout>
  );
}

function CreateTicketModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', client_name: '', project_name: '', project_type: 'Dispatch',
    domain: '', site_address: '', priority: 'Medium', sla_hours: '', description: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, source: 'manual' };
      if (form.sla_hours) payload.sla_hours = Number(form.sla_hours);
      else delete payload.sla_hours;
      const ticket = await api.createTicket(token, payload);
      onCreated(ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New ticket" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input required value={form.title} onChange={set('title')} placeholder="Windows login issue" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Client</label>
            <input required value={form.client_name} onChange={set('client_name')} placeholder="Acme GmbH" />
          </div>
          <div className="field">
            <label>Project type</label>
            <select value={form.project_type} onChange={set('project_type')}>
              <option value="Dispatch">Dispatch</option>
              <option value="FTE">FTE</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Domain</label>
            <input value={form.domain} onChange={set('domain')} placeholder="Basic Windows Support" />
          </div>
          <div className="field">
            <label>Site address</label>
            <input value={form.site_address} onChange={set('site_address')} placeholder="Berlin Office" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Priority</label>
            <select value={form.priority} onChange={set('priority')}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </div>
          <div className="field">
            <label>SLA (hours)</label>
            <input type="number" min="1" value={form.sla_hours} onChange={set('sla_hours')} placeholder="4" />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={set('description')} placeholder="What's going on…" />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Creating…' : 'Create ticket'}
        </button>
      </form>
    </Modal>
  );
}
