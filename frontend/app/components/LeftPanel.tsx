import { SegmentSummary } from "./SegmentSummary";
import { SignalFeed } from "./SignalFeed";

export function LeftPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Signal Feed
        </p>
        <SegmentSummary />
      </div>
      <div className="flex-1 overflow-y-auto panel-scroll min-h-0">
        <div className="px-4 pb-4">
          <SignalFeed />
        </div>
      </div>
    </div>
  );
}
