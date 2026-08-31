import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import TimesheetReportModal from '../components/TimesheetReportModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const CAN_DECIDE = ['service_desk', 'admin'];
const CAN_ACT = ['engineer', 'admin'];

export default function Attendance() {
  const { token, user } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [engineerId, setEngineerId] = useState('');
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [showLeave, setShowLeave] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    api.listEngineers(token).then((res) => {
      setEngineers(res.engineers || []);
      if (res.engineers?.length) setEngineerId(res.engineers[0].id);
    });
  }, [token]);

  function load(id) {
    api.listAttendance(token, { engineer_id: id }).then((res) => {
      setRecords(res.attendance || []);
      setLeaves(res.leave_requests || []);
    });
  }

  useEffect(() => { if (engineerId) load(engineerId); }, [token, engineerId]);

  async function checkIn() {
    setBanner(null);
    try {
      await api.checkIn(token, { engineer_id: engineerId, location: '' });
      setBanner({ type: 'info', text: 'Checked in — marked ON-SITE for today.' });
      load(engineerId);
    } catch (e) {
      setBanner({ type: 'error', text: e.message });
    }
  }

  async function checkOut() {
    setBanner(null);
    try {
      await api.checkOut(token, { engineer_id: engineerId });
      setBanner({ type: 'info', text: 'Checked out — have a good one.' });
      load(engineerId);
    } catch (e) {
      setBanner({ type: 'error', text: e.message });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.date === today);
  const canCheckOut = todayRecord && !todayRecord.check_out_at;

  async function decide(leaveId, decision) {
    await api.decideLeave(token, leaveId, decision);
    load(engineerId);
  }

  function formatDuration(checkIn, checkOut) {
    if (!checkOut) return '—';
    const ms = new Date(checkOut) - new Date(checkIn);
    if (ms < 0) return '—';
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  return (
    <Layout
      title="Attendance"
      subtitle="Portal check-in and leave requests for field engineers."
      actions={
        <>
          <button className="btn btn-ghost" onClick={() => setShowReport(true)}>Monthly Report</button>
          {CAN_ACT.includes(user?.role) && (
            <>
              <button className="btn btn-ghost" onClick={() => setShowLeave(true)}>Request leave</button>
              {canCheckOut ? (
                <button className="btn btn-primary" onClick={checkOut}>I am OFF-SITE</button>
              ) : (
                <button className="btn btn-accent" onClick={checkIn}>I am ON-SITE</button>
              )}
            </>
          )}
        </>
      }
    >
      <div className="field" style={{ maxWidth: 320, marginBottom: 18 }}>
        <label>Viewing engineer</label>
        <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
          {engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {banner && <div className={`banner banner-${banner.type}`}>{banner.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="card-pad"><h3 style={{ fontSize: 15 }}>Check-in history</h3></div>
          <div className="table-wrap">
            {records.length === 0 ? (
              <div className="empty-state">No check-ins recorded yet.</div>
            ) : (
              <table>
                <thead><tr><th>Date</th><th>Status</th><th>Check-in</th><th>Check-out</th><th>Duration</th></tr></thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.status}</td>
                      <td>{new Date(r.check_in_at).toLocaleTimeString()}</td>
                      <td>{r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString() : '—'}</td>
                      <td>{formatDuration(r.check_in_at, r.check_out_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-pad"><h3 style={{ fontSize: 15 }}>Leave requests</h3></div>
          <div className="table-wrap">
            {leaves.length === 0 ? (
              <div className="empty-state">No leave requests.</div>
            ) : (
              <table>
                <thead><tr><th>Dates</th><th>Reason</th><th>Status</th>{CAN_DECIDE.includes(user?.role) && <th></th>}</tr></thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td>{l.from_date} → {l.to_date}</td>
                      <td>{l.reason || '—'}</td>
                      <td>{l.status}</td>
                      {CAN_DECIDE.includes(user?.role) && (
                        <td>
                          {l.status === 'Pending' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => decide(l.id, 'approved')}>Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => decide(l.id, 'rejected')}>Reject</button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showLeave && (
        <LeaveModal
          token={token}
          engineerId={engineerId}
          onClose={() => setShowLeave(false)}
          onCreated={() => { setShowLeave(false); load(engineerId); }}
        />
      )}

      {showReport && <TimesheetReportModal engineers={engineers} onClose={() => setShowReport(false)} />}
    </Layout>
  );
}

function LeaveModal({ token, engineerId, onClose, onCreated }) {
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.requestLeave(token, { engineer_id: engineerId, ...form });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Request leave" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>From</label><input required type="date" value={form.from_date} onChange={set('from_date')} /></div>
          <div className="field"><label>To</label><input required type="date" value={form.to_date} onChange={set('to_date')} /></div>
        </div>
        <div className="field">
          <label>Reason</label>
          <textarea rows={3} value={form.reason} onChange={set('reason')} placeholder="Family event…" />
        </div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </Modal>
  );
}
