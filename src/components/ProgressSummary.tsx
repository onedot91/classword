type ProgressSummaryProps = {
  completedCount: number;
  totalCount: number;
  participantCount?: number;
  compact?: boolean;
};

export function ProgressSummary({ completedCount, totalCount, participantCount, compact }: ProgressSummaryProps) {
  return (
    <div className={compact ? 'progress-summary compact' : 'progress-summary'}>
      <div>
        {compact ? null : <span className="summary-label">완료</span>}
        <strong>
          {completedCount}/{totalCount}
        </strong>
      </div>
      {typeof participantCount === 'number' ? (
        <div>
          {compact ? null : <span className="summary-label">참여</span>}
          <strong>{participantCount}/23</strong>
        </div>
      ) : null}
    </div>
  );
}
