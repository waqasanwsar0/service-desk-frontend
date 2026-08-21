const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data;
}

export const api = {
  // Auth
  register: (input) => request('/api/auth/register', { method: 'POST', body: input }),
  login: (input) => request('/api/auth/login', { method: 'POST', body: input }),
  me: (token) => request('/api/auth/me', { token }),

  // Tickets
  listTickets: (token, params = {}) =>
    request(`/api/tickets${qs(params)}`, { token }),
  getTicket: (token, id) => request(`/api/tickets/${id}`, { token }),
  createTicket: (token, input) => request('/api/tickets', { method: 'POST', body: input, token }),
  assignTicket: (token, id, input) =>
    request(`/api/tickets/${id}/assign`, { method: 'PATCH', body: input, token }),
  updateTicketStatus: (token, id, status) =>
    request(`/api/tickets/${id}/status`, { method: 'PATCH', body: { status }, token }),

  // Engineers
  listEngineers: (token, params = {}) =>
    request(`/api/engineers${qs(params)}`, { token }),
  getEngineer: (token, id) => request(`/api/engineers/${id}`, { token }),
  createEngineer: (token, input) => request('/api/engineers', { method: 'POST', body: input, token }),
  setEngineerAvailability: (token, id, available) =>
    request(`/api/engineers/${id}/availability`, { method: 'PATCH', body: { available }, token }),

  // Attendance
  checkIn: (token, input) => request('/api/attendance/checkin', { method: 'POST', body: input, token }),
  checkOut: (token, input) => request('/api/attendance/checkout', { method: 'POST', body: input, token }),
  requestLeave: (token, input) =>
    request('/api/attendance/leave-request', { method: 'POST', body: input, token }),
  decideLeave: (token, id, decision) =>
    request(`/api/attendance/leave-request/${id}/decision`, { method: 'PATCH', body: { decision }, token }),
  listAttendance: (token, params = {}) => request(`/api/attendance${qs(params)}`, { token }),

  // Timesheets
  listTimesheets: (token, params = {}) => request(`/api/timesheets${qs(params)}`, { token }),
  createTimesheet: (token, input) => request('/api/timesheets', { method: 'POST', body: input, token }),
  approveTimesheet: (token, id) => request(`/api/timesheets/${id}/approve`, { method: 'PATCH', token }),
  rejectTimesheet: (token, id) => request(`/api/timesheets/${id}/reject`, { method: 'PATCH', token }),

  // Accounting
  listEntities: (token) => request('/api/entities', { token }),
  createEntity: (token, input) => request('/api/entities', { method: 'POST', body: input, token }),
  listInvoices: (token, params = {}) => request(`/api/invoices${qs(params)}`, { token }),
  getInvoice: (token, id) => request(`/api/invoices/${id}`, { token }),
  createInvoice: (token, input) => request('/api/invoices', { method: 'POST', body: input, token }),
  sendInvoice: (token, id) => request(`/api/invoices/${id}/send`, { method: 'PATCH', token }),
  payInvoice: (token, id) => request(`/api/invoices/${id}/paid`, { method: 'PATCH', token }),
  recordPayment: (token, id, amount) =>
    request(`/api/invoices/${id}/payment`, { method: 'PATCH', body: { amount }, token }),
  cancelInvoice: (token, id) => request(`/api/invoices/${id}/cancel`, { method: 'PATCH', token }),
  markInvoiceOverdue: (token, id) => request(`/api/invoices/${id}/overdue`, { method: 'PATCH', token }),
  listAdjustmentNotes: (token, invoiceId) => request(`/api/invoices/${invoiceId}/adjustment-notes`, { token }),
  createAdjustmentNote: (token, input) => request('/api/adjustment-notes', { method: 'POST', body: input, token }),

  // Vendor bills & profitability
  listVendorBills: (token, params = {}) => request(`/api/vendor-bills${qs(params)}`, { token }),
  createVendorBill: (token, input) => request('/api/vendor-bills', { method: 'POST', body: input, token }),
  approveVendorBill: (token, id) => request(`/api/vendor-bills/${id}/approve`, { method: 'PATCH', token }),
  payVendorBill: (token, id) => request(`/api/vendor-bills/${id}/pay`, { method: 'PATCH', token }),
  getTicketProfitability: (token, ticketId) => request(`/api/tickets/${ticketId}/profitability`, { token }),

  // Contracts / SOW tracking
  listContracts: (token, params = {}) => request(`/api/contracts${qs(params)}`, { token }),
  createContract: (token, input) => request('/api/contracts', { method: 'POST', body: input, token }),

  // Engineer multi-project assignments (re-hire)
  listAssignments: (token, engineerId) => request(`/api/engineers/${engineerId}/assignments`, { token }),
  createAssignment: (token, engineerId, input) =>
    request(`/api/engineers/${engineerId}/assignments`, { method: 'POST', body: input, token }),
  endAssignment: (token, id) => request(`/api/assignments/${id}/end`, { method: 'PATCH', token }),

  // Dashboard
  getDashboard: (token) => request('/api/dashboard', { token }),
  getRecruitmentDashboard: (token) => request('/api/applicants/dashboard', { token }),
  getRecruiterPerformance: (token) => request('/api/recruiters/performance', { token }),

  // Admin — database backup
  getBackupStatus: (token) => request('/api/admin/backup/status', { token }),

  // Applicants (ATS)
  listApplicants: (token, params = {}) => request(`/api/applicants${qs(params)}`, { token }),
  createApplicant: (token, input) => request('/api/applicants', { method: 'POST', body: input, token }),
  moveApplicantStage: (token, id, stage) =>
    request(`/api/applicants/${id}/stage`, { method: 'PATCH', body: { stage }, token }),
  addApplicantNote: (token, id, text) =>
    request(`/api/applicants/${id}/notes`, { method: 'POST', body: { text }, token }),

  // LinkedIn / manual outreach tracking
  listOutreach: (token, params = {}) => request(`/api/outreach${qs(params)}`, { token }),
  createOutreach: (token, input) => request('/api/outreach', { method: 'POST', body: input, token }),
  updateOutreachStatus: (token, id, status) =>
    request(`/api/outreach/${id}/status`, { method: 'PATCH', body: { status }, token }),
  addOutreachNote: (token, id, text) =>
    request(`/api/outreach/${id}/notes`, { method: 'POST', body: { text }, token }),

  // Projects
  listProjects: (token, params = {}) => request(`/api/projects${qs(params)}`, { token }),
  createProject: (token, input) => request('/api/projects', { method: 'POST', body: input, token }),

  // Dispatches (auto-generates a ticket)
  listDispatches: (token) => request('/api/dispatches', { token }),
  createDispatch: (token, input) => request('/api/dispatches', { method: 'POST', body: input, token }),

  // Ticket images
  addTicketImage: (token, ticketId, imageUrl) =>
    request(`/api/tickets/${ticketId}/images`, { method: 'POST', body: { image_url: imageUrl }, token }),

  // Timesheet FTE sign-off
  signTimesheet: (token, id) => request(`/api/timesheets/${id}/sign`, { method: 'PATCH', token }),

  // Client requirements
  listRequirements: (token, params = {}) => request(`/api/requirements${qs(params)}`, { token }),
  createRequirement: (token, input) => request('/api/requirements', { method: 'POST', body: input, token }),

  // Sales CRM (leads)
  listLeads: (token, params = {}) => request(`/api/leads${qs(params)}`, { token }),
  createLead: (token, input) => request('/api/leads', { method: 'POST', body: input, token }),
  updateLeadStatus: (token, id, status) => request(`/api/leads/${id}/status`, { method: 'PATCH', body: { status }, token }),
  addLeadNote: (token, id, text) => request(`/api/leads/${id}/notes`, { method: 'POST', body: { text }, token }),
  getLeadsReport: (token) => request('/api/leads/report', { token }),

  // Social media task management
  listSocialTasks: (token, params = {}) => request(`/api/social-tasks${qs(params)}`, { token }),
  createSocialTask: (token, input) => request('/api/social-tasks', { method: 'POST', body: input, token }),
  updateSocialTaskStatus: (token, id, status) =>
    request(`/api/social-tasks/${id}/status`, { method: 'PATCH', body: { status }, token }),
  addSocialTaskNote: (token, id, text) => request(`/api/social-tasks/${id}/notes`, { method: 'POST', body: { text }, token }),
  getSocialTaskDashboard: (token) => request('/api/social-tasks/dashboard', { token }),

  // Employee salary management
  listSalaries: (token, params = {}) => request(`/api/salaries${qs(params)}`, { token }),
  createSalary: (token, input) => request('/api/salaries', { method: 'POST', body: input, token }),
  markSalaryPaid: (token, id) => request(`/api/salaries/${id}/paid`, { method: 'PATCH', token }),
};

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

export { ApiError };

// Uploads a file (image, video, or PDF) and returns {id, filename,
// content_type, size, url}. Separate from request() since this sends
// multipart/form-data, not JSON.
export async function uploadFile(token, file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || `Upload failed (${res.status})`, res.status);
  }
  return data;
}

// Resolves a stored file's relative URL (e.g. "/api/files/FILE-000001")
// to a full URL the browser can load directly in <img>/<video>/<a> tags.
export function fileUrl(relativeUrl) {
  if (!relativeUrl) return relativeUrl;
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${BASE_URL}${relativeUrl}`;
}

// Downloads the full database backup as a file. Doesn't go through the
// standard request() helper since the response is a file, not JSON —
// fetches with the auth header, then triggers a normal browser download.
export async function downloadBackup(token) {
  const res = await fetch(`${BASE_URL}/api/admin/backup`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error || `Backup download failed (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename=([^;]+)/);
  const filename = match ? match[1].trim() : 'servicedesk-backup.json';

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
