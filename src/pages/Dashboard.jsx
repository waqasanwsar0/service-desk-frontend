import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { stageColor } from '../lib/stages';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getDashboard(token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <Layout title={`Welcome back, ${firstName(user?.name)}`} subtitle="Here's what's moving through dispatch right now.">
      {error && <div className="banner banner-error">{error}</div>}
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{data.period_counts.today}</div>
              <div className="stat-label">Tickets today</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.period_counts.this_week}</div>
              <div className="stat-label">This week</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.period_counts.this_month}</div>
              <div className="stat-label">This month</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--status-onsite)' }}>{data.timesheet_missing.length}</div>
              <div className="stat-label">Timesheets missing</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--status-paid)' }}>{data.engineer_availability.available}</div>
              <div className="stat-label">Engineers available</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.engineer_availability.unavailable}</div>
              <div className="stat-label">Engineers unavailable</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
            <div className="card">
              <div className="card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 15 }}>Upcoming visits</h3>
                <Link to="/tickets" className="btn btn-ghost btn-sm">View all tickets</Link>
              </div>
              <div className="table-wrap">
                {data.upcoming_visits.length === 0 ? (
                  <div className="empty-state">No upcoming SLA deadlines.</div>
                ) : (
                  <table>
                    <thead><tr><th>ID</th><th>Title</th><th>Client</th><th>SLA due</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.upcoming_visits.slice(0, 8).map((t) => (
                        <tr key={t.id} className="clickable" onClick={() => (window.location.href = `/tickets/${t.id}`)}>
                          <td className="id-cell">{t.id}</td>
                          <td>{t.title}</td>
                          <td>{t.client_name}</td>
                          <td>{new Date(t.sla_due_at).toLocaleString()}</td>
                          <td><StatusPill label={t.status} color={stageColor(t.status)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="card card-pad">
                <div className="section-title" style={{ marginTop: 0 }}>Timesheets missing</div>
                {data.timesheet_missing.length === 0 ? (
                  <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>All onsite tickets have timesheets.</div>
                ) : (
                  data.timesheet_missing.map((t) => (
                    <Link key={t.id} to={`/tickets/${t.id}`} style={{ display: 'block', padding: '6px 0', fontSize: 13 }}>
                      <span className="mono" style={{ color: 'var(--ink-soft)', marginRight: 6 }}>{t.id}</span>
                      {t.title}
                    </Link>
                  ))
                )}
              </div>

              <div className="card card-pad">
                <div className="section-title" style={{ marginTop: 0 }}>Leave calendar</div>
                {data.leave_calendar.length === 0 ? (
                  <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No approved leave coming up.</div>
                ) : (
                  data.leave_calendar.map((l) => (
                    <div key={l.id} style={{ padding: '6px 0', fontSize: 13 }}>
                      <span className="mono" style={{ color: 'var(--ink-soft)', marginRight: 6 }}>{l.engineer_id}</span>
                      {l.from_date} → {l.to_date}
                    </div>
                  ))
                )}
              </div>

              <div className="card card-pad">
                <div className="section-title" style={{ marginTop: 0 }}>Tickets by client</div>
                {Object.entries(data.tickets_by_client).length === 0 ? (
                  <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No tickets yet.</div>
                ) : (
                  Object.entries(data.tickets_by_client).map(([client, count]) => (
                    <div key={client} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                      <span>{client}</span>
                      <span style={{ fontWeight: 600 }}>{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

function firstName(name) {
  if (!name) return '';
  return name.split(' ')[0];
}
