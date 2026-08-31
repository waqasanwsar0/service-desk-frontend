import { useState } from 'react';
import Modal from './Modal';
import { generateInvoicePDF } from '../lib/pdfTemplates';

// Opens pre-filled with the invoice's own line items, and asks only for
// the extra fields the PDF template needs that aren't part of the
// invoice record (customer address/VAT, dispatch title, contact name).
export default function InvoicePdfModal({ invoice, onClose }) {
  const [form, setForm] = useState({
    invNo: invoice.id,
    invDate: new Date(invoice.created_at).toISOString().slice(0, 10),
    custNo: '',
    periodStart: '',
    periodEnd: '',
    dueDate: '',
    contactName: '',
    dispatchTitle: '',
    custName: invoice.client_name,
    custVat: '',
    custAddress: '',
    vatPct: '0',
    senderName: 'Viora Solutions Ltd',
    senderAddress: '124 city road EC1V2NX, London UK',
    senderCity: 'London, United Kingdom',
    senderEmail: '',
    senderPhone: '',
    senderIban: '',
    signatoryName: '',
  });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const rows = invoice.line_items.map((li) => ({
    ticket: li.ticket_id,
    month: new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    country: '',
    city: '',
    engineer: '',
    cost: li.amount,
  }));

  function generate() {
    try {
      generateInvoicePDF({ ...form, rows });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={`Generate PDF — ${invoice.id}`} onClose={onClose} width={560}>
      {error && <div className="banner banner-error">{error}</div>}
      <div className="field-hint" style={{ marginBottom: 12 }}>
        Line items and total are already filled in from this invoice. Fill in a few extra details for the PDF layout.
      </div>
      <div className="field-row">
        <div className="field"><label>Customer number</label><input value={form.custNo} onChange={set('custNo')} /></div>
        <div className="field"><label>Contact name</label><input value={form.contactName} onChange={set('contactName')} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Period start</label><input type="date" value={form.periodStart} onChange={set('periodStart')} /></div>
        <div className="field"><label>Period end</label><input type="date" value={form.periodEnd} onChange={set('periodEnd')} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Due date</label><input type="date" value={form.dueDate} onChange={set('dueDate')} /></div>
        <div className="field"><label>VAT %</label><input type="number" step="0.1" value={form.vatPct} onChange={set('vatPct')} /></div>
      </div>
      <div className="field"><label>Dispatch / project title</label><input value={form.dispatchTitle} onChange={set('dispatchTitle')} placeholder="Aix-en-provence France-Dispatch_July 2026" /></div>
      <div className="field"><label>Customer VAT number</label><input value={form.custVat} onChange={set('custVat')} /></div>
      <div className="field"><label>Customer address</label><textarea rows={2} value={form.custAddress} onChange={set('custAddress')} /></div>
      <div className="field"><label>Signatory name</label><input value={form.signatoryName} onChange={set('signatoryName')} /></div>
      <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} onClick={generate}>
        Generate PDF
      </button>
    </Modal>
  );
}
