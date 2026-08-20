import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, downloadBackup } from '../api/client';

export default function Admin() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.getBackupStatus(token).then(setStatus).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      await downloadBackup(token);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  const totalRows = status?.row_counts ? Object.values(status.row_counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <Layout title="Admin" subtitle="Database backup and system status.">
      {error && <div className="banner banner-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : status?.mode === 'in-memory' ? (
        <div className="banner banner-error">
          Running in in-memory mode — there is no persistent database, so there's nothing to back up.
          Data resets whenever the server restarts.
        </div>
      ) : (
        <>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>Database backup</h3>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  Downloads a full snapshot of every table as a JSON file — save it somewhere safe
                  (shared drive, email to yourself) as a manual backup.
                </div>
              </div>
              <button className="btn btn-accent" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Preparing…' : '⬇ Download backup'}
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              {totalRows} total records across {status?.row_counts ? Object.keys(status.row_counts).length : 0} tables ·
              last checked {status?.checked_at ? new Date(status.checked_at).toLocaleString() : '—'}
            </div>
          </div>

          <div className="card">
            <div className="card-pad"><h3 style={{ fontSize: 15 }}>Records per table</h3></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Table</th><th>Rows</th></tr></thead>
                <tbody>
                  {status?.row_counts && Object.entries(status.row_counts).map(([table, count]) => (
                    <tr key={table}>
                      <td className="mono" style={{ fontSize: 13 }}>{table}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
