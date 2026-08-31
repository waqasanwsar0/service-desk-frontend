import { useState } from 'react';
import Modal from './Modal';
import { generateContractorAgreementPDF } from '../lib/pdfTemplates';

export default function ContractorAgreementModal({ engineer, onClose }) {
  const [form, setForm] = useState({
    companyName: 'Viora Solutions Ltd',
    companyAddress: '124 City Road, London, EC1V 2NX, United Kingdom',
    companySigName: '',
    companySigTitle: 'Managing Director',
    engName: engineer.name,
    engAddress: '',
    engRole: (engineer.skills && engineer.skills[0]) || 'Field Service Engineer',
    engSite: engineer.location || '',
    effDate: new Date().toISOString().slice(0, 10),
    term: 'Project-based, until dispatch complete',
    noticePeriod: '14 days',
    rateType: engineer.hourly_rate ? 'hourly rate' : 'daily rate',
    rateAmount: engineer.hourly_rate ? `${engineer.hourly_rate} ${engineer.currency}/hour` : `${engineer.day_rate || ''} ${engineer.currency}/day`,
    paymentTerms: 'Payable within 30 days of Company receiving Client payment for the corresponding dispatch',
    govLaw: 'England and Wales',
    currency: engineer.currency || 'EUR',
    scope: 'On-site technical field service, installation, commissioning, and maintenance support as directed by Company for Client dispatches, including travel to assigned Client sites as required.',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal title={`Generate contract — ${engineer.name}`} onClose={onClose} width={560}>
      <div className="field-row">
        <div className="field"><label>Engineer address</label><input value={form.engAddress} onChange={set('engAddress')} /></div>
        <div className="field"><label>Role</label><input value={form.engRole} onChange={set('engRole')} /></div>
      </div>
      <div className="field"><label>Client / site assignment</label><input value={form.engSite} onChange={set('engSite')} /></div>
      <div className="field-row">
        <div className="field"><label>Effective date</label><input type="date" value={form.effDate} onChange={set('effDate')} /></div>
        <div className="field"><label>Notice period</label><input value={form.noticePeriod} onChange={set('noticePeriod')} /></div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Rate type</label>
          <select value={form.rateType} onChange={set('rateType')}>
            <option value="daily rate">Daily rate</option>
            <option value="hourly rate">Hourly rate</option>
            <option value="fixed project fee">Fixed project fee</option>
          </select>
        </div>
        <div className="field"><label>Rate amount</label><input value={form.rateAmount} onChange={set('rateAmount')} /></div>
      </div>
      <div className="field"><label>Payment terms</label><input value={form.paymentTerms} onChange={set('paymentTerms')} /></div>
      <div className="field-row">
        <div className="field"><label>Governing law</label><input value={form.govLaw} onChange={set('govLaw')} /></div>
        <div className="field"><label>Company signatory</label><input value={form.companySigName} onChange={set('companySigName')} /></div>
      </div>
      <div className="field"><label>Description of services</label><textarea rows={2} value={form.scope} onChange={set('scope')} /></div>
      <button
        className="btn btn-accent"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => { generateContractorAgreementPDF(form); onClose(); }}
      >
        Generate PDF Agreement
      </button>
    </Modal>
  );
}
