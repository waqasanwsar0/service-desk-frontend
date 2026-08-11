import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SignalRail from '../components/SignalRail';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { NEXT_STAGE, PRIORITY_COLORS, stageColor } from '../lib/stages';

const CAN_ASSIGN = ['service_desk', 'admin'];
const CAN_ADVANCE = ['service_desk', 'admin', 'engineer'];
const CAN_SEE_PROFIT = ['admin', 'accounts', 'service_desk'];

export default function TicketDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [profitability, setProfitability] = useState(null);
  const [showVendorBill, setShowVendorBill] = useState(false);
  const [error, setError] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [showTimesheet, setShowTimesheet] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    api.getTicket(token, id).then(setTicket).catch((e) => setError(e.message));
    api.listTimesheets(token, { ticket_id: id }).then((res) => setTimesheets(res.timesheets || []));
    if (CAN_SEE_PROFIT.includes(user?.role)) {
      api.getTicketProfitability(token, id).then(setProfitability).catch(() => {});
    }
  }

  useEffect(load, [token, id]);

  async function advance() {
    if (!ticket) return;
    const next = NEXT_STAGE[ticket.status];
    if (!next) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api.updateTicketStatus(token, ticket.id, next);
      setTicket(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ticket) {
    return (
      <Layout title="Ticket" subtitle="">
        {error ? <div className="banner banner-error">{error}</div> : <div className="empty-state">Loading…</div>}
      </Layout>
    );
  }

  const nextStage = NEXT_STAGE[ticket.status];

  return (
    <Layout
      title={ticket.title}
      subtitle={
        <span className="mono" style={{ fontSize: 12 }}>
          {ticket.id} · {ticket.client_name}
        </span>
      }
      actions={
        <>
          {CAN_ASSIGN.includes(user?.role) && (
            <button className="btn btn-ghost" onClick={() => setShowAssign(true)}>
              {ticket.assigned_engineer_id ? 'Reassign' : 'Assign engineer'}
            </button>
          )}
          {CAN_ADVANCE.includes(user?.role) && nextStage && nextStage !== 'Timesheet Pending' && (
            <button className="btn btn-primary" onClick={advance} disabled={busy}>
              Move to {nextStage} →
            </button>
          )}
        </>
      }
    >
      {error && <div className="banner banner-error">{error}</div>}

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <SignalRail status={ticket.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>Details</div>
          <dl className="kv-grid">
            <dt>Priority</dt>
            <dd><StatusPill label={ticket.priority} color={PRIORITY_COLORS[ticket.priority] || 'var(--ink-faint)'} /></dd>
            <dt>Status</dt>
            <dd><StatusPill label={ticket.status} color={stageColor(ticket.status)} /></dd>
            <dt>Project</dt>
            <dd>{ticket.project_name || '—'} <span style={{ color: 'var(--ink-faint)' }}>({ticket.project_type})</span></dd>
            <dt>Domain</dt>
            <dd>{ticket.domain || '—'}</dd>
            <dt>Site address</dt>
            <dd>{ticket.site_address || '—'}</dd>
            <dt>Source</dt>
            <dd style={{ textTransform: 'capitalize' }}>{ticket.source}</dd>
            <dt>Engineer</dt>
            <dd>{ticket.assigned_engineer_name || 'Unassigned'}</dd>
            <dt>SLA due</dt>
            <dd>{ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : '—'}</dd>
          </dl>
          {ticket.description && (
            <>
              <div className="divider" />
              <div style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>{ticket.description}</div>
            </>
          )}
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Timesheets</span>
            {ticket.status === 'Onsite' && CAN_ADVANCE.includes(user?.role) && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTimesheet(true)}>+ Upload</button>
            )}
          </div>
          {timesheets.length === 0 ? (
            <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No timesheets uploaded yet.</div>
          ) : (
            timesheets.map((ts) => (
              <div key={ts.id} className="note" style={{ borderLeftColor: 'var(--status-timesheet)' }}>
                <div className="note-meta">{ts.id} · {ts.job_type}</div>
                <div style={{ fontSize: 13 }}>
                  {ts.status}
                  {ts.status === 'Approved' && <> — {ts.billed_amount} {ts.currency}</>}
                </div>
              </div>
            ))
          )}
        </div>

        {CAN_SEE_PROFIT.includes(user?.role) && (
          <div className="card card-pad">
            <div className="section-title" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Profitability</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowVendorBill(true)}>+ Vendor bill</button>
            </div>
            {profitability ? (
              <dl className="kv-grid">
                <dt>Billed to client</dt>
                <dd>{profitability.billed_amount} {profitability.currency}</dd>
                <dt>Vendor cost</dt>
                <dd>{profitability.vendor_cost} {profitability.currency}</dd>
                <dt>Profit</dt>
                <dd style={{ fontWeight: 600, color: profitability.profit >= 0 ? 'var(--status-paid)' : 'var(--danger)' }}>
                  {profitability.profit} {profitability.currency}
                </dd>
              </dl>
            ) : (
              <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No billing data yet.</div>
            )}
          </div>
        )}
      </div>

      {showVendorBill && (
        <VendorBillModal
          token={token}
          ticket={ticket}
          onClose={() => setShowVendorBill(false)}
          onCreated={() => { setShowVendorBill(false); load(); }}
        />
      )}

      {showAssign && (
        <AssignModal
          token={token}
          ticket={ticket}
          onClose={() => setShowAssign(false)}
          onAssigned={(t) => { setTicket(t); setShowAssign(false); }}
        />
      )}

      {showTimesheet && (
        <TimesheetModal
          token={token}
          ticket={ticket}
          onClose={() => setShowTimesheet(false)}
          onCreated={() => { setShowTimesheet(false); load(); }}
        />
      )}
    </Layout>
  );
}

function AssignModal({ token, ticket, onClose, onAssigned }) {
  const [engineers, setEngineers] = useState([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listEngineers(token, { available_only: 'true' }).then((res) => setEngineers(res.engineers || []));
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    const eng = engineers.find((x) => x.id === selected);
    if (!eng) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api.assignTicket(token, ticket.id, { engineer_id: eng.id, engineer_name: eng.name });
      onAssigned(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Assign engineer" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Available engineers</label>
          <select required value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Select an engineer…</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.location} — {e.hourly_rate}/{e.currency} hr
              </option>
            ))}
          </select>
          {engineers.length === 0 && <span className="field-hint">No available engineers found. Add one from the Engineers page.</span>}
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !selected}>
          {busy ? 'Assigning…' : 'Assign'}
        </button>
      </form>
    </Modal>
  );
}

function VendorBillModal({ token, ticket, onClose, onCreated }) {
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState({ entity_id: '', vendor_name: ticket.assigned_engineer_name || '', amount: '', currency: 'EUR', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listEntities(token).then((res) => {
      setEntities(res.entities || []);
      if (res.entities?.length) setForm((f) => ({ ...f, entity_id: res.entities[0].id, currency: res.entities[0].default_currency }));
    });
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createVendorBill(token, { ...form, ticket_id: ticket.id, amount: Number(form.amount) });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add vendor bill" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Billing entity</label>
          <select required value={form.entity_id} onChange={(e) => setForm((f) => ({ ...f, entity_id: e.target.value }))}>
            <option value="">Select…</option>
            {entities.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.default_currency})</option>)}
          </select>
        </div>
        <div className="field">
          <label>Vendor / engineer name</label>
          <input required value={form.vendor_name} onChange={(e) => setForm((f) => ({ ...f, vendor_name: e.target.value }))} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Amount</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="field">
            <label>Currency</label>
            <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label>Notes</label>
          <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Travel + labor…" />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add vendor bill'}
        </button>
      </form>
    </Modal>
  );
}

function TimesheetModal({ token, ticket, onClose, onCreated }) {
  const [form, setForm] = useState({ check_in_at: '', check_out_at: '', job_type: 'Hourly', file_url: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createTimesheet(token, {
        ticket_id: ticket.id,
        engineer_id: ticket.assigned_engineer_id,
        job_type: form.job_type,
        check_in_at: new Date(form.check_in_at).toISOString(),
        check_out_at: new Date(form.check_out_at).toISOString(),
        file_url: form.file_url,
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Upload timesheet" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Job type</label>
          <select value={form.job_type} onChange={set('job_type')}>
            <option value="Hourly">Hourly</option>
            <option value="HalfDay">Half day</option>
            <option value="FullDay">Full day</option>
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Check-in</label>
            <input required type="datetime-local" value={form.check_in_at} onChange={set('check_in_at')} />
          </div>
          <div className="field">
            <label>Check-out</label>
            <input required type="datetime-local" value={form.check_out_at} onChange={set('check_out_at')} />
          </div>
        </div>
        <div className="field">
          <label>File URL (PDF/JPG)</label>
          <input value={form.file_url} onChange={set('file_url')} placeholder="https://…" />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload timesheet'}
        </button>
      </form>
    </Modal>
  );
}
