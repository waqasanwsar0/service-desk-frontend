import { useEffect, useState } from 'react';
import Modal from './Modal';
import { api } from '../api/client';
import { generateTimesheetPDF } from '../lib/pdfTemplates';
import { useAuth } from '../context/AuthContext';

// Pulls the engineer's real attendance check-in/check-out records for
// the selected month and pre-fills the report rows from them — falls
// back to a blank row per weekday if there's no attendance data yet.
export default function TimesheetReportModal({ engineers, onClose }) {
  const { token } = useAuth();
  const [engineerId, setEngineerId] = useState(engineers[0]?.id || '');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!engineerId) return;
    setLoading(true);
    api.listAttendance(token, { engineer_id: engineerId }).then((res) => {
      const records = (res.attendance || []).filter((r) => r.date.startsWith(month));
      setRows(
        records.map((r) => ({
          date: r.date,
          start: new Date(r.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          end: r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          hours: r.check_out_at ? (((new Date(r.check_out_at) - new Date(r.check_in_at)) / 3600000).toFixed(2)) : '',
          notes: r.status,
        }))
      );
    }).finally(() => setLoading(false));
  }, [token, engineerId, month]);

  const engineer = engineers.find((e) => e.id === engineerId);

  function generate() {
    generateTimesheetPDF({
      engineerName: engineer?.name,
      role: (engineer?.skills && engineer.skills[0]) || '',
      client: engineer?.location || '',
      month,
      companyName: 'Lemons Edge — Monthly Timesheet',
      rows,
    });
    onClose();
  }

  return (
    <Modal title="Generate monthly timesheet report" onClose={onClose} width={560}>
      <div className="field-row">
        <div className="field">
          <label>Engineer</label>
          <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
            {engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Month</label><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
      </div>

      <div className="field-hint" style={{ marginBottom: 10 }}>
        Rows are pulled automatically from this engineer's check-in/check-out history for the selected month.
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ color: 'var(--ink-faint)', fontSize: 13, marginBottom: 12 }}>No attendance records for this month yet.</div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 10px', fontSize: 12.5, borderBottom: '1px solid var(--border)' }}>
              <span style={{ width: 90 }}>{r.date}</span>
              <span style={{ width: 60 }}>{r.start}</span>
              <span style={{ width: 60 }}>{r.end}</span>
              <span style={{ width: 50 }}>{r.hours}h</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} onClick={generate} disabled={!engineerId}>
        Generate PDF
      </button>
    </Modal>
  );
}
