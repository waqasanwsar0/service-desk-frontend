import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { APPLICANT_STAGES } from '../lib/stages';

export default function Applicants() {
  const { token } = useAuth();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('pipeline');

  function load() {
    setLoading(true);
    api.listApplicants(token).then((res) => setApplicants(res.applicants || [])).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  const columns = [...APPLICANT_STAGES, 'Rejected'];

  return (
    <Layout
      title="Applicants"
      subtitle="Recruitment pipeline, from application to hire."
      actions={
        <>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              className="btn btn-sm"
              style={{ background: view === 'pipeline' ? 'var(--ink)' : 'transparent', color: view === 'pipeline' ? 'white' : 'var(--ink)', borderRadius: 0 }}
              onClick={() => setView('pipeline')}
            >
              Pipeline
            </button>
            <button
              className="btn btn-sm"
              style={{ background: view === 'performance' ? 'var(--ink)' : 'transparent', color: view === 'performance' ? 'white' : 'var(--ink)', borderRadius: 0 }}
              onClick={() => setView('performance')}
            >
              Performance
            </button>
          </div>
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Add candidate</button>
        </>
      }
    >
      {view === 'performance' ? (
        <PerformanceView token={token} />
      ) : loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {columns.map((stage) => (
            <div key={stage} style={{ minWidth: 220, flex: '0 0 220px' }}>
              <div className="section-title" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>{stage}</span>
                <span style={{ color: 'var(--ink-faint)' }}>{applicants.filter((a) => a.stage === stage).length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {applicants.filter((a) => a.stage === stage).map((a) => (
                  <div key={a.id} className="card card-pad" style={{ cursor: 'pointer' }} onClick={() => setSelected(a)}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{a.job_title}</div>
                  </div>
                ))}
                {applicants.filter((a) => a.stage === stage).length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '8px 2px' }}>Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateApplicantModal token={token} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}

      {selected && (
        <ApplicantDetailModal
          token={token}
          applicant={selected}
          onClose={() => setSelected(null)}
          onUpdated={(a) => { setSelected(a); load(); }}
        />
      )}
    </Layout>
  );
}

function PerformanceView({ token }) {
  const [dashboard, setDashboard] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getRecruitmentDashboard(token), api.getRecruiterPerformance(token)])
      .then(([d, p]) => {
        setDashboard(d);
        setPerformance(p);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="empty-state">Loading…</div>;

  const projects = Object.entries(dashboard.by_project || {});

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{dashboard.total_open}</div>
          <div className="stat-label">Open pipeline</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--status-paid)' }}>{dashboard.total_hired}</div>
          <div className="stat-label">Hired</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{dashboard.total_rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="card-pad"><h3 style={{ fontSize: 15 }}>Pipeline by project</h3></div>
          <div className="table-wrap">
            {projects.length === 0 ? (
              <div className="empty-state">No candidates yet.</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Project</th><th>Applied</th><th>Screening</th><th>Interview</th><th>Offer</th><th>Hired</th><th>Rejected</th></tr>
                </thead>
                <tbody>
                  {projects.map(([project, stages]) => (
                    <tr key={project}>
                      <td>{project}</td>
                      <td>{stages.Applied || 0}</td>
                      <td>{stages.Screening || 0}</td>
                      <td>{stages.Interview || 0}</td>
                      <td>{stages.Offer || 0}</td>
                      <td style={{ color: 'var(--status-paid)', fontWeight: 600 }}>{stages.Hired || 0}</td>
                      <td style={{ color: 'var(--danger)' }}>{stages.Rejected || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-pad"><h3 style={{ fontSize: 15 }}>Recruiter performance</h3></div>
          <div className="table-wrap">
            {(performance.recruiters || []).length === 0 ? (
              <div className="empty-state">No recruiter-assigned candidates yet.</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Recruiter</th><th>Handled</th><th>Hired</th><th>Hire rate</th></tr>
                </thead>
                <tbody>
                  {performance.recruiters.map((r) => (
                    <tr key={r.recruiter_id}>
                      <td className="id-cell">{r.recruiter_id}</td>
                      <td>{r.total_handled}</td>
                      <td>{r.hired}</td>
                      <td>{r.hire_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateApplicantModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', job_title: '', resume_url: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createApplicant(token, form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add candidate" onClose={onClose}>
      {error && <div className="banner banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={set('email')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Job title</label><input required value={form.job_title} onChange={set('job_title')} placeholder="Field Engineer" /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
        </div>
        <div className="field"><label>Resume URL</label><input value={form.resume_url} onChange={set('resume_url')} placeholder="https://…" /></div>
        <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Adding…' : 'Add candidate'}
        </button>
      </form>
    </Modal>
  );
}

function ApplicantDetailModal({ token, applicant, onClose, onUpdated }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function moveStage(stage) {
    try {
      const updated = await api.moveApplicantStage(token, applicant.id, stage);
      onUpdated(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      const updated = await api.addApplicantNote(token, applicant.id, note);
      setNote('');
      onUpdated(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const idx = APPLICANT_STAGES.indexOf(applicant.stage);
  const next = idx >= 0 && idx < APPLICANT_STAGES.length - 1 ? APPLICANT_STAGES[idx + 1] : null;

  return (
    <Modal title={applicant.name} onClose={onClose} width={520}>
      {error && <div className="banner banner-error">{error}</div>}
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
        {applicant.job_title} · {applicant.email}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {next && applicant.stage !== 'Rejected' && (
          <button className="btn btn-primary btn-sm" onClick={() => moveStage(next)}>Move to {next} →</button>
        )}
        {applicant.stage !== 'Hired' && applicant.stage !== 'Rejected' && (
          <button className="btn btn-danger btn-sm" onClick={() => moveStage('Rejected')}>Reject</button>
        )}
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>Chat with recruiter</div>
      <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 10 }}>
        {(applicant.notes || []).length === 0 ? (
          <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No notes yet.</div>
        ) : (
          applicant.notes.map((n, i) => (
            <div key={i} className="note">
              <div className="note-meta">{new Date(n.created_at).toLocaleString()}</div>
              <div style={{ fontSize: 13.5 }}>{n.text}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={addNote} style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}
          value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
        <button className="btn btn-primary btn-sm" disabled={busy}>Send</button>
      </form>
    </Modal>
  );
}
