import { SegmentSummary } from "./SegmentSummary";
import { SignalFeed } from "./SignalFeed";

export function LeftPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
        Signal Feed
      </p>
      <SegmentSummary />
      <div className="flex-1 overflow-y-auto">
        <SignalFeed />
      </div>
    </div>
  );
}
