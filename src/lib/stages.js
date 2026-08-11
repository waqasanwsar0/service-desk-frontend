export const TICKET_STAGES = [
  { key: 'New', label: 'New', color: 'var(--status-new)' },
  { key: 'Assigned', label: 'Assigned', color: 'var(--status-assigned)' },
  { key: 'Onsite', label: 'Onsite', color: 'var(--status-onsite)' },
  { key: 'Timesheet Pending', label: 'Timesheet', color: 'var(--status-timesheet)' },
  { key: 'Completed', label: 'Completed', color: 'var(--status-completed)' },
  { key: 'Invoice', label: 'Invoice', color: 'var(--status-invoice)' },
  { key: 'Paid', label: 'Paid', color: 'var(--status-paid)' },
];

export function stageColor(status) {
  const stage = TICKET_STAGES.find((s) => s.key === status);
  return stage ? stage.color : 'var(--ink-faint)';
}

export function stageIndex(status) {
  return TICKET_STAGES.findIndex((s) => s.key === status);
}

export const NEXT_STAGE = TICKET_STAGES.reduce((acc, stage, i) => {
  if (i < TICKET_STAGES.length - 1) acc[stage.key] = TICKET_STAGES[i + 1].key;
  return acc;
}, {});

export const APPLICANT_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

export const PRIORITY_COLORS = {
  Low: 'var(--status-new)',
  Medium: 'var(--status-assigned)',
  High: 'var(--status-onsite)',
  Critical: 'var(--danger)',
};
