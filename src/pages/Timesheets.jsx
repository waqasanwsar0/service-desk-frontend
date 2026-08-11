import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const CAN_DECIDE = ['service_desk', 'admin', 'accounts'];

export default function Timesheets() {
  const { token, user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  function load() {
    setLoading(true);
    api.listTimesheets(token).then((res) => setTimesheets(res.timesheets || [])).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function approve(id) {
    setBanner(null);
    try {
      await api.approveTimesheet(token, id);
      load();
    } catch (e) {
      setBanner({ type: 'error', text: e.message });
    }
  }

  async function reject(id) {
    setBanner(null);
    try {
      await api.rejectTimesheet(token, id);
      load();
    } catch (e) {
      setBanner({ type: 'error', text: e.message });
    }
  }

  return (
    <Layout title="Timesheets" subtitle="Uploaded proof of work, awaiting review and billing.">
      {banner && <div className={`banner banner-${banner.type}`}>{banner.text}</div>}
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : timesheets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No timesheets yet</div>
              These appear once an engineer's ticket moves to Onsite and a timesheet is uploaded.
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>ID</th><th>Ticket</th><th>Job type</th><th>Status</th><th>Billed</th>{CAN_DECIDE.includes(user?.role) && <th></th>}</tr>
              </thead>
              <tbody>
                {timesheets.map((ts) => (
                  <tr key={ts.id}>
                    <td className="id-cell">{ts.id}</td>
                    <td className="id-cell">{ts.ticket_id}</td>
                    <td>{ts.job_type}</td>
                    <td>{ts.status}</td>
                    <td>{ts.status === 'Approved' ? `${ts.billed_amount} ${ts.currency}` : '—'}</td>
                    {CAN_DECIDE.includes(user?.role) && (
                      <td>
                        {ts.status === 'Pending Review' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => approve(ts.id)}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => reject(ts.id)}>Reject</button>
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
    </Layout>
  );
}
