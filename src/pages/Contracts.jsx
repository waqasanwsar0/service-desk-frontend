import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ServiceAgreementModal from '../components/ServiceAgreementModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const CAN_CREATE = ['admin', 'accounts'];

export default function Contracts() {
  const { token, user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [agreementFor, setAgreementFor] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.listContracts(token), api.listContracts(token, { expiring_within_days: 30 })])
      .then(([all, soon]) => {
        setContracts(all.contracts || []);
        setExpiringSoon(soon.contracts || []);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  return (
    <Layout
      title="Contracts"
      subtitle="Client SOWs, billing terms, and renewal reminders."
      actions={
        CAN_CREATE.includes(user?.role) && (
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ New contract</button>
        )
      }
    >
      {expiringSoon.length > 0 && (
        <div className="banner banner-error">
          {expiringSoon.length} contract{expiringSoon.length === 1 ? '' : 's'} expiring within 30 days:{' '}
          {expiringSoon.map((c) => c.client_name).join(', ')}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : contracts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No contracts yet</div>
              Add one to start tracking scope, billing terms, and renewal dates.
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>ID</th><th>Client</th><th>Scope</th><th>Billing terms</th><th>Start</th><th>Expiry</th><th>Auto-renew</th><th></th></tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="id-cell">{c.id}</td>
                    <td>{c.client_name}</td>
                    <td>{c.project_scope || '—'}</td>
                    <td>{c.billing_terms || '—'}</td>
                    <td>{c.start_date}</td>
                    <td>{c.expiry_date}</td>
                    <td>{c.auto_renew ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setAgreementFor(c)}>Agreement</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateContractModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}

      {agreementFor && <ServiceAgreementModal contract={agreementFor} onClose={() => setAgreementFor(null)} />}
    </Layout>
  );
}

function CreateContractModal({ token, onClose, onCreated }) {
  const [entities, setEntities] = useState([]);
  const [form, setForm] = useState({
    client_name: '', entity_id: '', project_scope: '', billing_terms: 'Hourly',
    start_date: '', expiry_date: '', auto_renew: false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listEntities(token).then((res) => setEntities(res.entities || []));
  }, [token]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createContract(token, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New contract" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Client</label><input required value={form.client_name} onChange={set('client_name')} /></div>
          <div className="field">
            <label>Entity</label>
            <select value={form.entity_id} onChange={set('entity_id')}>
              <option value="">None</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Project scope</label>
          <textarea rows={2} value={form.project_scope} onChange={set('project_scope')} placeholder="Onsite IT support across 12 branches…" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Billing terms</label>
            <select value={form.billing_terms} onChange={set('billing_terms')}>
              <option>Hourly</option><option>Fixed price</option><option>Retainer</option>
            </select>
          </div>
          <div className="field">
            <label>Auto-renew</label>
            <select value={form.auto_renew} onChange={(e) => setForm((f) => ({ ...f, auto_renew: e.target.value === 'true' }))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field"><label>Start date</label><input required type="date" value={form.start_date} onChange={set('start_date')} /></div>
          <div className="field"><label>Expiry date</label><input required type="date" value={form.expiry_date} onChange={set('expiry_date')} /></div>
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add contract'}
        </button>
      </form>
    </Modal>
  );
}
