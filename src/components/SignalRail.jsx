import { TICKET_STAGES, stageIndex } from '../lib/stages';

// The signature visual for the whole app: every ticket's position in the
// New -> ... -> Paid lifecycle rendered as a lit signal track, the same
// mental model a dispatcher uses on a physical board.
export default function SignalRail({ status, compact = false }) {
  const current = stageIndex(status);

  return (
    <div>
      <div className="signal-rail">
        {TICKET_STAGES.map((stage, i) => {
          const filled = i <= current;
          const isCurrent = i === current;
          return (
            <div className="signal-step" key={stage.key}>
              <div
                className={`signal-node ${filled ? 'filled' : ''} ${isCurrent ? 'current' : ''}`}
                style={{
                  '--node-color': stage.color,
                  background: filled ? stage.color : undefined,
                }}
                title={stage.label}
              />
              {i < TICKET_STAGES.length - 1 && (
                <div
                  className={`signal-line ${i < current ? 'filled' : ''}`}
                  style={{ '--node-color-prev': stage.color }}
                />
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="signal-labels">
          {TICKET_STAGES.map((stage, i) => (
            <div
              key={stage.key}
              style={{
                width: i < TICKET_STAGES.length - 1 ? 38 : 12,
                color: i === current ? 'var(--ink)' : undefined,
                fontWeight: i === current ? 600 : 400,
              }}
            >
              {i === current ? stage.label : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
