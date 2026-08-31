// PDF generators ported from the Viora Solutions document templates.
// Each function takes a plain data object (not DOM reads) so it can be
// called from anywhere in the app — a button on an invoice, a contract,
// an engineer, or a monthly timesheet report.
//
// Requires jsPDF + jspdf-autotable to be loaded globally (see index.html
// script tags) — that's how the original templates worked, and keeping
// them as CDN globals avoids adding npm dependencies.

function fmtDateDMY(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function fmtDateLong(iso) {
  if (!iso) return '[Date]';
  const [y, m, d] = iso.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

// ---------------------------------------------------------------------
// 1. Invoice PDF (Viora Solutions template)
// ---------------------------------------------------------------------
// data: {
//   invNo, invDate, custNo, periodStart, periodEnd, dueDate, contactName, dispatchTitle,
//   custName, custVat, custAddress, vatPct,
//   rows: [{ ticket, month, country, city, engineer, cost }],
//   senderName, senderAddress, senderCity, senderEmail, senderPhone, senderIban, signatoryName,
// }
export function generateInvoicePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  const rows = (data.rows || []).filter((r) => r.ticket || r.city || r.cost);
  if (rows.length === 0) throw new Error('Add at least one service line before generating.');

  const invNo = data.invNo || '—';
  const invDate = fmtDateDMY(data.invDate);
  const periodStart = fmtDateDMY(data.periodStart);
  const periodEnd = fmtDateDMY(data.periodEnd);
  const dueDate = fmtDateDMY(data.dueDate);
  const vatPct = parseFloat(data.vatPct) || 0;

  let y = 50;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(data.senderName || 'Viora Solutions Ltd – 124 city road EC1V2NX', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.senderCity || 'London, United Kingdom', margin, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice-Nr.', pageWidth - margin - 160, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invNo, pageWidth - margin - 70, y);

  y += 50;

  doc.setFont('helvetica', 'bold');
  doc.text(data.custName || '—', margin, y);
  const addrLines = (data.custAddress || '').split('\n');
  doc.setFont('helvetica', 'normal');
  addrLines.forEach((line, i) => doc.text(line, margin, y + 14 + i * 13));
  if (data.custVat) doc.text('VAT: ' + data.custVat, margin, y + 14 + addrLines.length * 13);

  const metaX = pageWidth - margin - 160;
  const metaValX = pageWidth - margin - 70;
  const metaLabels = ['Invoice date', 'Time Period', 'Customer Number', 'Contact Name'];
  const metaValues = [invDate, `${periodStart} - ${periodEnd}`, data.custNo, data.contactName];
  doc.setFont('helvetica', 'bold');
  metaLabels.forEach((l, i) => doc.text(l, metaX, y + i * 14));
  doc.setFont('helvetica', 'normal');
  metaValues.forEach((v, i) => doc.text(v || '—', metaValX, y + i * 14));

  y += 80;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(`Invoice Nr. ${data.senderShortName || 'Viora Solutions'}_ ${data.dispatchTitle || ''}_${invNo}`, margin, y);

  y += 24;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text('Dear Customer,', margin, y);
  doc.text('Thank you for your trust and for choosing our service.', margin, y + 14);
  doc.text('I hereby invoice you for the following services.', margin, y + 28);

  y += 46;

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Ticket No', 'Activity Month', 'Country', 'City', 'Engineer Name', 'Service Cost']],
    body: rows.map((r) => [r.ticket, r.month, r.country, r.city, r.engineer, '€ ' + Number(r.cost || 0).toFixed(2)]),
    headStyles: { fillColor: [237, 125, 49], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 5: { halign: 'right' } },
    theme: 'grid',
  });

  let finalY = doc.lastAutoTable.finalY + 20;
  const net = rows.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const vat = net * (vatPct / 100);
  const gross = net + vat;

  doc.setFillColor(239, 239, 239);
  doc.rect(margin, finalY - 12, pageWidth - margin * 2, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Total Net Value', margin + 6, finalY);
  doc.text('€ ' + net.toFixed(2), pageWidth - margin - 70, finalY);

  finalY += 22;
  doc.setFont('helvetica', 'normal');
  doc.text(`VAT Tax ${vatPct}%`, margin + 6, finalY);
  doc.text('€ ' + vat.toFixed(2), pageWidth - margin - 70, finalY);

  finalY += 22;
  doc.setFillColor(239, 239, 239);
  doc.rect(margin, finalY - 12, pageWidth - margin * 2, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Total Brutto Amount', margin + 6, finalY);
  doc.text('€ ' + gross.toFixed(2), pageWidth - margin - 70, finalY);

  finalY += 40;
  doc.setFont('helvetica', 'normal');
  doc.text('Please transfer the invoice amount, stating the invoice number, to the account specified below.', margin, finalY);
  finalY += 20;
  doc.text(`The invoice amount is due ${dueDate || '—'}.`, margin, finalY);

  finalY += 34;
  doc.text('Thanks and Regards', margin, finalY);
  doc.text(data.signatoryName || '', margin, finalY + 14);

  const footY = 780;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(data.senderShortName || 'Viora Solutions', margin, footY);
  doc.text('Tel: ' + (data.senderPhone || ''), margin + 150, footY);
  doc.text('Account Holder: ' + (data.senderName || ''), margin + 330, footY);

  doc.text(data.senderAddress || '', margin, footY + 12);
  doc.text('E-Mail: ' + (data.senderEmail || ''), margin + 150, footY + 12);
  doc.text('Managing Director: ' + (data.signatoryName || ''), margin + 330, footY + 12);

  doc.text('IBAN: ' + (data.senderIban || ''), margin + 330, footY + 24);

  doc.save(`Invoice_${invNo || 'draft'}.pdf`);
}

// ---------------------------------------------------------------------
// 2. Engineer / Contractor Agreement PDF
// ---------------------------------------------------------------------
export function generateContractorAgreementPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const usableWidth = pageWidth - margin * 2;
  let y = 60;

  function ensureSpace(need) {
    if (y + need > pageHeight - 50) { doc.addPage(); y = 60; }
  }
  function heading(text) {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += 26;
  }
  function clauseTitle(num, text) {
    ensureSpace(24);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
    doc.text(`${num}. ${text}`, margin, y);
    y += 16;
  }
  function paragraph(text) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, usableWidth);
    lines.forEach((line) => { ensureSpace(14); doc.text(line, margin, y); y += 13.5; });
    y += 6;
  }

  const companyName = data.companyName || 'Company';
  const companyAddress = data.companyAddress || '';
  const companySigName = data.companySigName || '';
  const companySigTitle = data.companySigTitle || '';
  const engName = data.engName || '[Engineer Name]';
  const engAddress = data.engAddress || '[Engineer Address]';
  const engRole = data.engRole || 'Field Service Engineer';
  const engSite = data.engSite || '[Client / Site Assignment]';
  const effDate = fmtDateLong(data.effDate);
  const term = data.term || 'Project-based, until dispatch complete';
  const noticePeriod = data.noticePeriod || '14 days';
  const rateType = data.rateType || 'daily rate';
  const rateAmount = data.rateAmount || '[Rate Amount]';
  const paymentTerms = data.paymentTerms || 'Payable within 30 days of Company receiving Client payment for the corresponding dispatch';
  const govLaw = data.govLaw || 'England and Wales';
  const currency = data.currency || 'EUR';
  const scope = data.scope || 'On-site technical field service, installation, commissioning, and maintenance support as directed by Company for Client dispatches, including travel to assigned Client sites as required.';

  heading('INDEPENDENT CONTRACTOR AGREEMENT');
  paragraph(`This Independent Contractor Agreement ("Agreement") is entered into on ${effDate} ("Effective Date") between:`);
  paragraph(`${companyName}, having its registered address at ${companyAddress} ("Company"); and`);
  paragraph(`${engName}, of ${engAddress} ("Contractor"),`);
  paragraph('together referred to as the "Parties" and each individually as a "Party".');

  let n = 1;
  clauseTitle(n++, 'Engagement and Services');
  paragraph(`Company engages Contractor, and Contractor accepts engagement, to perform the role of ${engRole}, providing the following services: ${scope}`);
  paragraph(`Contractor's current assignment under this Agreement is: ${engSite}. Company may, from time to time and with reasonable notice, assign Contractor to other Client sites or dispatches consistent with Contractor's role and availability.`);

  clauseTitle(n++, 'Independent Contractor Status');
  paragraph('Contractor is an independent contractor and not an employee, agent, partner, or joint venturer of Company. Nothing in this Agreement shall be construed to create an employment relationship. Contractor is responsible for their own tax, social security, and statutory filings arising from payments under this Agreement, unless otherwise required by mandatory local law at the place of engagement.');

  clauseTitle(n++, 'Term and Termination');
  paragraph(`This Agreement shall commence on the Effective Date and continue for the following term: ${term}, unless terminated earlier in accordance with this clause.`);
  paragraph(`Either Party may terminate this Agreement for convenience by giving no less than ${noticePeriod} written notice to the other Party. Company may terminate this Agreement immediately on written notice if Contractor commits a material breach, engages in misconduct at a Client site, or fails to meet Client site safety or conduct requirements.`);

  clauseTitle(n++, 'Compensation and Payment');
  paragraph(`Contractor shall be compensated on the basis of a ${rateType}, currently set at ${rateAmount} (${currency}), for Services actually performed and confirmed (e.g. via signed timesheet).`);
  paragraph(`Payment terms: ${paymentTerms}.`);
  paragraph('Contractor shall submit timesheets or activity records in the form reasonably required by Company as a condition of payment. Reasonable, pre-approved travel and accommodation expenses directly attributable to a dispatch shall be reimbursed by Company upon submission of valid receipts, unless otherwise agreed in writing.');

  clauseTitle(n++, 'Site Conduct and Compliance');
  paragraph('Contractor shall comply with all applicable health, safety, and site-access requirements of the Client at each assigned site, including induction, PPE, and security protocols, and shall conduct themselves professionally at all times while representing Company.');

  clauseTitle(n++, 'Confidentiality');
  paragraph('Contractor shall keep confidential all non-public information belonging to Company or its Clients that Contractor accesses in the course of the engagement, and shall not disclose or use such information other than for the purposes of performing the Services. This obligation shall survive termination of this Agreement for a period of two (2) years.');

  clauseTitle(n++, 'Intellectual Property');
  paragraph('Any work product, reports, designs, or documentation created by Contractor specifically in the course of performing the Services shall be owned by Company (or, where applicable, assigned onward to the relevant Client) upon payment, save that Contractor retains the right to use general skills, know-how, and experience gained during the engagement.');

  clauseTitle(n++, 'Liability and Insurance');
  paragraph("Contractor shall exercise reasonable skill and care in performing the Services. Company's total aggregate liability to Contractor arising under or in connection with this Agreement shall not exceed the total fees paid to Contractor in the three (3) months preceding the event giving rise to the claim, save in respect of liability that cannot be limited or excluded by law. Contractor is responsible for maintaining any insurance required by applicable law for their trade or profession.");

  clauseTitle(n++, 'Non-Solicitation');
  paragraph("During the term of this Agreement and for six (6) months thereafter, Contractor shall not directly solicit or accept work from any Client of Company to whom Contractor was introduced or dispatched under this Agreement, without Company's prior written consent.");

  clauseTitle(n++, 'Governing Law and Jurisdiction');
  paragraph(`This Agreement shall be governed by and construed in accordance with the laws of ${govLaw}. The Parties submit to the exclusive jurisdiction of the courts of ${govLaw} to resolve any dispute arising out of or in connection with this Agreement.`);

  clauseTitle(n++, 'General Provisions');
  paragraph('This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior discussions or agreements. No variation of this Agreement shall be effective unless made in writing and signed by both Parties. If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.');

  ensureSpace(120);
  y += 20;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('SIGNED for and on behalf of the Parties:', margin, y);
  y += 34;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.line(margin, y, margin + 220, y);
  doc.line(margin + 280, y, margin + 500, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, margin, y);
  doc.text('Contractor', margin + 280, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${companySigName || '____________________'}`, margin, y);
  doc.text(`Name: ${engName || '____________________'}`, margin + 280, y);
  y += 14;
  doc.text(`Title: ${companySigTitle || '____________________'}`, margin, y);
  y += 14;
  doc.text('Date: ____________________', margin, y);
  doc.text('Date: ____________________', margin + 280, y);

  doc.save(`Contractor_Agreement_${(engName || 'Engineer').replace(/\s+/g, '_')}.pdf`);
}

// ---------------------------------------------------------------------
// 3. Client Service Agreement PDF
// ---------------------------------------------------------------------
export function generateServiceAgreementPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const usableWidth = pageWidth - margin * 2;
  let y = 60;

  function ensureSpace(need) { if (y + need > pageHeight - 50) { doc.addPage(); y = 60; } }
  function heading(text) {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += 26;
  }
  function clauseTitle(num, text) {
    ensureSpace(24);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
    doc.text(`${num}. ${text}`, margin, y);
    y += 16;
  }
  function paragraph(text) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, usableWidth);
    lines.forEach((line) => { ensureSpace(14); doc.text(line, margin, y); y += 13.5; });
    y += 6;
  }

  const providerName = data.providerName || 'Provider';
  const providerAddress = data.providerAddress || '';
  const providerSigName = data.providerSigName || '';
  const providerSigTitle = data.providerSigTitle || '';
  const clientName = data.clientName || '[Client Name]';
  const clientAddress = data.clientAddress || '[Client Address]';
  const clientSigName = data.clientSigName || '';
  const clientSigTitle = data.clientSigTitle || '';
  const effDate = fmtDateLong(data.effDate);
  const term = data.term || '12 months';
  const noticePeriod = data.noticePeriod || '30 days';
  const feeType = data.feeType || 'daily rate';
  const feeAmount = data.feeAmount || '[Fee Amount]';
  const paymentTerms = data.paymentTerms || 'Net 30 days from invoice date';
  const govLaw = data.govLaw || 'England and Wales';
  const currency = data.currency || 'EUR';
  const scope = data.scope || 'Provision of qualified field service engineers for on-site technical dispatch, installation, and maintenance support at Client-designated project sites, as requested by Client from time to time via written or email instruction.';

  heading('SERVICE AGREEMENT');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  paragraph(`This Service Agreement ("Agreement") is entered into on ${effDate} ("Effective Date") between:`);
  paragraph(`${providerName}, having its registered address at ${providerAddress} ("Provider"); and`);
  paragraph(`${clientName}, having its registered address at ${clientAddress} ("Client"),`);
  paragraph('together referred to as the "Parties" and each individually as a "Party".');

  let n = 1;
  clauseTitle(n++, 'Scope of Services');
  paragraph(scope);
  paragraph('Provider shall assign suitably qualified personnel to perform the Services and may, at its discretion, substitute assigned personnel with personnel of equivalent or greater qualification, provided this does not materially disrupt ongoing work at a Client site without reasonable prior notice.');

  clauseTitle(n++, 'Term and Termination');
  paragraph(`This Agreement shall commence on the Effective Date and continue for an initial term of ${term}, unless terminated earlier in accordance with this clause ("Initial Term"). Thereafter, the Agreement shall automatically renew on a rolling basis unless either Party gives written notice of non-renewal.`);
  paragraph(`Either Party may terminate this Agreement for convenience by giving no less than ${noticePeriod} written notice to the other Party. Either Party may terminate this Agreement immediately on written notice if the other Party commits a material breach that is not remedied within 14 days of written notice, or becomes insolvent.`);

  clauseTitle(n++, 'Fees and Payment');
  paragraph(`Client shall pay Provider fees on the basis of a ${feeType}, currently set at ${feeAmount} (${currency}), for Services rendered.`);
  paragraph(`Provider shall issue invoices for Services performed, and Client shall pay each undisputed invoice within the following terms: ${paymentTerms}. Amounts not paid when due shall accrue interest at the statutory rate applicable under the laws governing this Agreement.`);
  paragraph('Fees do not include applicable taxes, duties, or levies, which shall be added to invoices where legally required.');

  clauseTitle(n++, 'Client Obligations');
  paragraph('Client shall: (a) provide Provider personnel with safe and reasonable access to Client sites necessary to perform the Services; (b) provide timely information, approvals, and instructions reasonably required for the Services; and (c) ensure that its own site safety, security, and induction requirements are communicated to Provider in advance of dispatch.');

  clauseTitle(n++, 'Confidentiality');
  paragraph('Each Party shall keep confidential all non-public information disclosed by the other Party in connection with this Agreement, and shall use such information solely for the purposes of performing its obligations under this Agreement. This obligation shall survive termination of this Agreement for a period of two (2) years, and shall not apply to information that is or becomes publicly available through no fault of the receiving Party, or that is required to be disclosed by law.');

  clauseTitle(n++, 'Intellectual Property');
  paragraph('Each Party retains ownership of its pre-existing intellectual property. Any work product created specifically for Client under this Agreement and expressly paid for as a deliverable shall be owned by Client upon full payment, save that Provider retains the right to use general knowledge, skills, and methodologies gained in performing the Services.');

  clauseTitle(n++, 'Liability');
  paragraph("Neither Party shall be liable to the other for any indirect, incidental, or consequential loss, including loss of profit or business opportunity, arising out of or in connection with this Agreement. Each Party's total aggregate liability arising under or in connection with this Agreement shall not exceed the total fees paid or payable by Client under this Agreement in the twelve (12) months preceding the event giving rise to the claim, save in respect of liability that cannot be limited or excluded by law (including death, personal injury, or fraud).");

  clauseTitle(n++, 'Insurance');
  paragraph('Provider shall maintain, at its own expense, appropriate professional indemnity and public liability insurance commensurate with the nature of the Services provided under this Agreement, and shall provide evidence of such cover to Client upon reasonable request.');

  clauseTitle(n++, 'Force Majeure');
  paragraph('Neither Party shall be liable for any failure or delay in performing its obligations under this Agreement to the extent such failure or delay is caused by circumstances beyond its reasonable control, including but not limited to acts of God, war, civil unrest, epidemic, or governmental action.');

  clauseTitle(n++, 'Governing Law and Jurisdiction');
  paragraph(`This Agreement shall be governed by and construed in accordance with the laws of ${govLaw}. The Parties submit to the exclusive jurisdiction of the courts of ${govLaw} to resolve any dispute arising out of or in connection with this Agreement.`);

  clauseTitle(n++, 'General Provisions');
  paragraph('This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior discussions or agreements. No variation of this Agreement shall be effective unless made in writing and signed by both Parties. Neither Party may assign this Agreement without the prior written consent of the other Party, save that Provider may assign this Agreement to an affiliate. If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.');

  ensureSpace(120);
  y += 20;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('SIGNED for and on behalf of the Parties:', margin, y);
  y += 34;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.line(margin, y, margin + 220, y);
  doc.line(margin + 280, y, margin + 500, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text(providerName, margin, y);
  doc.text(clientName, margin + 280, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${providerSigName || '____________________'}`, margin, y);
  doc.text(`Name: ${clientSigName || '____________________'}`, margin + 280, y);
  y += 14;
  doc.text(`Title: ${providerSigTitle || '____________________'}`, margin, y);
  doc.text(`Title: ${clientSigTitle || '____________________'}`, margin + 280, y);
  y += 14;
  doc.text('Date: ____________________', margin, y);
  doc.text('Date: ____________________', margin + 280, y);

  doc.save(`Service_Agreement_${(clientName || 'Client').replace(/\s+/g, '_')}.pdf`);
}

// ---------------------------------------------------------------------
// 4. Monthly Timesheet Report PDF
// ---------------------------------------------------------------------
// data: {
//   engineerName, role, client, month (YYYY-MM), companyName,
//   rows: [{ date, start, end, hours, notes }],
//   signatoryName,
// }
export function generateTimesheetPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text(data.companyName || 'Monthly Timesheet', margin, y);
  y += 20;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Engineer: ${data.engineerName || '—'}`, margin, y);
  doc.text(`Month: ${data.month || '—'}`, pageWidth - margin - 150, y);
  y += 14;
  doc.text(`Role: ${data.role || '—'}`, margin, y);
  doc.text(`Client / Site: ${data.client || '—'}`, pageWidth - margin - 220, y);
  y += 20;

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Date', 'Start', 'End', 'Hours', 'Notes']],
    body: (data.rows || []).map((r) => [r.date, r.start || '', r.end || '', r.hours || '', r.notes || '']),
    headStyles: { fillColor: [11, 61, 99], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    theme: 'grid',
  });

  let finalY = doc.lastAutoTable.finalY + 30;
  const totalHours = (data.rows || []).reduce((s, r) => s + (parseFloat(r.hours) || 0), 0);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(`Total hours: ${totalHours.toFixed(2)}`, margin, finalY);

  finalY += 40;
  doc.setFont('helvetica', 'normal');
  doc.line(margin, finalY, margin + 220, finalY);
  doc.line(margin + 280, finalY, margin + 500, finalY);
  finalY += 14;
  doc.text('Engineer signature', margin, finalY);
  doc.text('Approved by (Service Desk)', margin + 280, finalY);

  doc.save(`Timesheet_${(data.engineerName || 'Engineer').replace(/\s+/g, '_')}_${data.month || ''}.pdf`);
}
