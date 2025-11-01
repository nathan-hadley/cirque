import { useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { syncManager } from "@/services/sync/syncManager";
import { useQueueStore } from "@/stores/queueStore";

export function SyncInitializer() {
  const { isOnline } = useNetworkStatus();
  const showToast = useSimpleToast();
  const setQueueCount = useQueueStore(state => state.setCount);

  useEffect(() => {
    syncManager.initialize();
    syncManager.setCallbacks({
      onQueueChange: count => {
        setQueueCount(count);
      },
      onSubmissionSuccess: queuedSubmission => {
        showToast({
          action: "success",
          message: `${queuedSubmission.submission.problem.name} submitted successfully`,
        });
      },
      onSubmissionFailure: (queuedSubmission, error) => {
        showToast({
          action: "error",
          message: `${queuedSubmission.submission.problem.name} failed to submit: ${error.message}`,
        });
      },
    });
  }, [setQueueCount, showToast]);

  useEffect(() => {
    if (isOnline) syncManager.sync();
  }, [isOnline]);

  return null;
}
