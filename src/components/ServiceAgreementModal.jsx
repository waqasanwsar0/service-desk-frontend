import { useState } from 'react';
import Modal from './Modal';
import { generateServiceAgreementPDF } from '../lib/pdfTemplates';

export default function ServiceAgreementModal({ contract, onClose }) {
  const [form, setForm] = useState({
    providerName: 'Viora Solutions Ltd',
    providerAddress: '124 City Road, London, EC1V 2NX, United Kingdom',
    providerSigName: '',
    providerSigTitle: 'Managing Director',
    clientName: contract.client_name,
    clientAddress: '',
    clientSigName: '',
    clientSigTitle: '',
    effDate: contract.start_date || new Date().toISOString().slice(0, 10),
    term: '12 months',
    noticePeriod: '30 days',
    feeType: (contract.billing_terms || 'daily rate').toLowerCase(),
    feeAmount: '',
    paymentTerms: 'Net 30 days from invoice date',
    govLaw: 'England and Wales',
    currency: 'EUR',
    scope: contract.project_scope || 'Provision of qualified field service engineers for on-site technical dispatch, installation, and maintenance support at Client-designated project sites, as requested by Client from time to time via written or email instruction.',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title={`Generate agreement — ${contract.client_name}`} onClose={onClose} width={560}>
      <div className="field"><label>Client address</label><input value={form.clientAddress} onChange={set('clientAddress')} /></div>
      <div className="field-row">
        <div className="field"><label>Client signatory name</label><input value={form.clientSigName} onChange={set('clientSigName')} /></div>
        <div className="field"><label>Client signatory title</label><input value={form.clientSigTitle} onChange={set('clientSigTitle')} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Effective date</label><input type="date" value={form.effDate} onChange={set('effDate')} /></div>
        <div className="field"><label>Initial term</label><input value={form.term} onChange={set('term')} /></div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Fee structure</label>
          <select value={form.feeType} onChange={set('feeType')}>
            <option value="daily rate">Daily rate</option>
            <option value="hourly rate">Hourly rate</option>
            <option value="fixed project fee">Fixed project fee</option>
            <option value="monthly retainer">Monthly retainer</option>
          </select>
        </div>
        <div className="field"><label>Fee amount</label><input value={form.feeAmount} onChange={set('feeAmount')} placeholder="e.g. 200.00 EUR per dispatch" /></div>
      </div>
      <div className="field"><label>Payment terms</label><input value={form.paymentTerms} onChange={set('paymentTerms')} /></div>
      <div className="field"><label>Scope of services</label><textarea rows={2} value={form.scope} onChange={set('scope')} /></div>
      <button
        className="btn btn-accent"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => { generateServiceAgreementPDF(form); onClose(); }}
      >
        Generate PDF Agreement
      </button>
    </Modal>
  );
}
