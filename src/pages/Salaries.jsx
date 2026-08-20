import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Salaries() {
  const { token } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    setLoading(true);
    api.listSalaries(token).then((res) => setSalaries(res.salaries || [])).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function markPaid(id) {
    await api.markSalaryPaid(token, id);
    load();
  }

  return (
    <Layout
      title="Salaries"
      subtitle="Employee salary records — internal cost, separate from client billing."
      actions={<button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Add record</button>}
    >
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : salaries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No salary records yet</div>
            </div>
          ) : (
            <table>
              <thead><tr><th>Employee</th><th>Period</th><th>Amount</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s.id}>
                    <td>{s.employee_name}</td>
                    <td>{s.pay_period}</td>
                    <td>{s.amount} {s.currency}</td>
                    <td>{s.status}</td>
                    <td>
                      {s.status === 'Pending' && <button className="btn btn-ghost btn-sm" onClick={() => markPaid(s.id)}>Mark paid</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateSalaryModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
    </Layout>
  );
}

function CreateSalaryModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ employee_name: '', pay_period: new Date().toISOString().slice(0, 7), amount: '', currency: 'EUR', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createSalary(token, { ...form, amount: Number(form.amount) });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add salary record" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Employee name</label><input required value={form.employee_name} onChange={set('employee_name')} /></div>
        <div className="field-row">
          <div className="field"><label>Pay period</label><input required type="month" value={form.pay_period} onChange={set('pay_period')} /></div>
          <div className="field"><label>Amount</label><input required type="number" step="0.01" value={form.amount} onChange={set('amount')} /></div>
        </div>
        <div className="field"><label>Currency</label><input value={form.currency} onChange={set('currency')} /></div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add record'}
        </button>
      </form>
    </Modal>
  );
}
