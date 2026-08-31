import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import InvoicePdfModal from '../components/InvoicePdfModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Invoices() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEntity, setShowEntity] = useState(false);
  const [banner, setBanner] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [notesFor, setNotesFor] = useState(null);
  const [pdfFor, setPdfFor] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.listInvoices(token), api.listEntities(token)])
      .then(([inv, ent]) => {
        setInvoices(inv.invoices || []);
        setEntities(ent.entities || []);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function send(id) {
    await api.sendInvoice(token, id);
    load();
  }
  async function cancel(id) {
    try {
      await api.cancelInvoice(token, id);
      load();
    } catch (e) {
      setBanner({ type: 'error', text: e.message });
    }
  }
  async function markOverdue(id) {
    await api.markInvoiceOverdue(token, id);
    load();
  }

  return (
    <Layout
      title="Invoices"
      subtitle="Multi-entity, multi-currency billing generated from approved timesheets."
      actions={
        <>
          <button className="btn btn-ghost" onClick={() => setShowEntity(true)}>+ Entity</button>
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ New invoice</button>
        </>
      }
    >
      {banner && <div className={`banner banner-${banner.type}`}>{banner.text}</div>}

      <div className="section-title" style={{ marginTop: 0 }}>Billing entities</div>
      <div className="chip-row" style={{ marginBottom: 18 }}>
        {entities.length === 0 && <span style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No entities yet — add one to start invoicing.</span>}
        {entities.map((e) => (
          <span className="chip" key={e.id}>{e.name} · {e.country} · {e.default_currency}</span>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No invoices yet</div>
              Generate one from approved timesheets once work is billed.
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>ID</th><th>Client</th><th>Total</th><th>Paid</th><th>Status</th><th>Line items</th><th></th></tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="id-cell">{inv.id}</td>
                    <td>{inv.client_name}</td>
                    <td>{inv.total} {inv.currency}</td>
                    <td>{inv.amount_paid || 0} {inv.currency}</td>
                    <td>{inv.status}</td>
                    <td>{inv.line_items.length}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {inv.status === 'Draft' && <button className="btn btn-ghost btn-sm" onClick={() => send(inv.id)}>Mark sent</button>}
                        {(inv.status === 'Sent' || inv.status === 'Partially Paid' || inv.status === 'Overdue') && (
                          <button className="btn btn-primary btn-sm" onClick={() => setPayingId(inv.id)}>Record payment</button>
                        )}
                        {inv.status === 'Sent' && <button className="btn btn-ghost btn-sm" onClick={() => markOverdue(inv.id)}>Mark overdue</button>}
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button className="btn btn-danger btn-sm" onClick={() => cancel(inv.id)}>Cancel</button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => setNotesFor(inv.id)}>Notes</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPdfFor(inv)}>PDF</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showEntity && (
        <EntityModal token={token} onClose={() => setShowEntity(false)} onCreated={() => { setShowEntity(false); load(); }} />
      )}
      {showCreate && (
        <InvoiceModal
          token={token}
          entities={entities}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
          onError={(msg) => setBanner({ type: 'error', text: msg })}
        />
      )}

      {payingId && (
        <PaymentModal
          token={token}
          invoice={invoices.find((i) => i.id === payingId)}
          onClose={() => setPayingId(null)}
          onDone={() => { setPayingId(null); load(); }}
        />
      )}

      {notesFor && (
        <NotesModal token={token} invoiceId={notesFor} onClose={() => setNotesFor(null)} />
      )}

      {pdfFor && <InvoicePdfModal invoice={pdfFor} onClose={() => setPdfFor(null)} />}
    </Layout>
  );
}

function PaymentModal({ token, invoice, onClose, onDone }) {
  const remaining = invoice ? (invoice.total - (invoice.amount_paid || 0)).toFixed(2) : 0;
  const [amount, setAmount] = useState(remaining);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.recordPayment(token, invoice.id, Number(amount));
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Record payment — ${invoice.id}`} onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
        Total {invoice.total} {invoice.currency} · Paid so far {invoice.amount_paid || 0} {invoice.currency} · Remaining {remaining} {invoice.currency}
      </div>
      <form onSubmit={submit}>
        <div className="field">
          <label>Amount</label>
          <input required type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Recording…' : 'Record payment'}
        </button>
      </form>
    </Modal>
  );
}

function NotesModal({ token, invoiceId, onClose }) {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ type: 'Credit', amount: '', reason: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.listAdjustmentNotes(token, invoiceId).then((res) => setNotes(res.notes || []));
  }
  useEffect(load, [token, invoiceId]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createAdjustmentNote(token, { invoice_id: invoiceId, type: form.type, amount: Number(form.amount), reason: form.reason });
      setForm({ type: 'Credit', amount: '', reason: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Credit / debit notes — ${invoiceId}`} onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ marginBottom: 16 }}>
        {notes.length === 0 ? (
          <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No notes yet.</div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="note" style={{ borderLeftColor: n.type === 'Credit' ? 'var(--status-paid)' : 'var(--danger)' }}>
              <div className="note-meta">{n.id} · {n.type}</div>
              <div style={{ fontSize: 13.5 }}>{n.amount} — {n.reason || 'No reason given'}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </div>
          <div className="field">
            <label>Amount</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label>Reason</label>
          <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Goodwill discount…" />
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add note'}
        </button>
      </form>
    </Modal>
  );
}

function EntityModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', country: '', default_currency: 'EUR' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createEntity(token, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add billing entity" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Name</label><input required value={form.name} onChange={set('name')} placeholder="ServiceDesk GmbH" /></div>
        <div className="field-row">
          <div className="field"><label>Country</label><input value={form.country} onChange={set('country')} placeholder="Germany" /></div>
          <div className="field">
            <label>Default currency</label>
            <select value={form.default_currency} onChange={set('default_currency')}>
              <option>EUR</option><option>GBP</option><option>USD</option><option>PKR</option>
            </select>
          </div>
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add entity'}
        </button>
      </form>
    </Modal>
  );
}

function InvoiceModal({ token, entities, onClose, onCreated, onError }) {
  const [entityId, setEntityId] = useState(entities[0]?.id || '');
  const [clientName, setClientName] = useState('');
  const [timesheets, setTimesheets] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listTimesheets(token).then((res) => {
      const approved = (res.timesheets || []).filter((t) => t.status === 'Approved' && !t.invoice_id);
      setTimesheets(approved);
    });
  }, [token]);

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e) {
    e.preventDefault();
    if (!entityId || selected.length === 0) return;
    setBusy(true);
    setError('');
    try {
      await api.createInvoice(token, { entity_id: entityId, client_name: clientName, timesheet_ids: selected });
      onCreated();
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Generate invoice" onClose={onClose} width={560}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field">
            <label>Billing entity</label>
            <select required value={entityId} onChange={(e) => setEntityId(e.target.value)}>
              <option value="">Select…</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.default_currency})</option>)}
            </select>
          </div>
          <div className="field">
            <label>Client name</label>
            <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme GmbH" />
          </div>
        </div>

        <div className="field">
          <label>Approved timesheets, not yet invoiced</label>
          {timesheets.length === 0 ? (
            <div className="field-hint">No approved, unbilled timesheets available.</div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
              {timesheets.map((ts) => (
                <label key={ts.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <input type="checkbox" checked={selected.includes(ts.id)} onChange={() => toggle(ts.id)} />
                  <span className="mono" style={{ fontSize: 12 }}>{ts.id}</span>
                  <span style={{ color: 'var(--ink-soft)' }}>{ts.ticket_id}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 500 }}>{ts.billed_amount} {ts.currency}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={busy || selected.length === 0}>
          {busy ? 'Generating…' : `Generate invoice (${selected.length} item${selected.length === 1 ? '' : 's'})`}
        </button>
      </form>
    </Modal>
  );
}
