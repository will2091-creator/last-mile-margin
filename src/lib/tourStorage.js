const TOUR_COMPLETED_KEY = "hasCompletedTour";
const TOUR_COMPLETED_AT_KEY = "tourCompletedAt";
const TOUR_SKIPPED_AT_KEY = "tourSkippedAt";
const TOUR_STATUS_KEY = "finalMileProductTourStatus";
const TOUR_STEP_INDEX_KEY = "tourStepIndex";
const TOUR_STEP_ID_KEY = "tourStepId";
const TOUR_UPDATED_AT_KEY = "tourUpdatedAt";

const emptyTourStatus = {
  hasCompletedTour: false,
  tourCompletedAt: null,
  tourSkippedAt: null,
  tourStepIndex: 0,
  tourStepId: null,
  tourUpdatedAt: null,
};

export { emptyTourStatus };

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export function readProductTourStatus() {
  if (!canUseStorage()) return emptyTourStatus;

  try {
    const legacyStatus = JSON.parse(localStorage.getItem(TOUR_STATUS_KEY) || "null");
    return {
      hasCompletedTour:
        localStorage.getItem(TOUR_COMPLETED_KEY) === "true" ||
        Boolean(legacyStatus?.hasCompletedTour),
      tourCompletedAt:
        localStorage.getItem(TOUR_COMPLETED_AT_KEY) ||
        legacyStatus?.tourCompletedAt ||
        null,
      tourSkippedAt:
        localStorage.getItem(TOUR_SKIPPED_AT_KEY) ||
        legacyStatus?.tourSkippedAt ||
        null,
      tourStepIndex: Math.max(0, Number(localStorage.getItem(TOUR_STEP_INDEX_KEY) || legacyStatus?.tourStepIndex || 0)),
      tourStepId:
        localStorage.getItem(TOUR_STEP_ID_KEY) ||
        legacyStatus?.tourStepId ||
        null,
      tourUpdatedAt:
        localStorage.getItem(TOUR_UPDATED_AT_KEY) ||
        legacyStatus?.tourUpdatedAt ||
        null,
    };
  } catch (error) {
    console.warn("Could not read product tour status", error);
    return emptyTourStatus;
  }
}

function writeProductTourStatus(status) {
  if (!canUseStorage()) return status;

  localStorage.setItem(TOUR_COMPLETED_KEY, String(Boolean(status.hasCompletedTour)));
  if (status.tourCompletedAt) {
    localStorage.setItem(TOUR_COMPLETED_AT_KEY, status.tourCompletedAt);
  } else {
    localStorage.removeItem(TOUR_COMPLETED_AT_KEY);
  }

  if (status.tourSkippedAt) {
    localStorage.setItem(TOUR_SKIPPED_AT_KEY, status.tourSkippedAt);
  } else {
    localStorage.removeItem(TOUR_SKIPPED_AT_KEY);
  }

  localStorage.setItem(TOUR_STEP_INDEX_KEY, String(Math.max(0, Number(status.tourStepIndex || 0))));
  if (status.tourStepId) {
    localStorage.setItem(TOUR_STEP_ID_KEY, status.tourStepId);
  } else {
    localStorage.removeItem(TOUR_STEP_ID_KEY);
  }

  if (status.tourUpdatedAt) {
    localStorage.setItem(TOUR_UPDATED_AT_KEY, status.tourUpdatedAt);
  } else {
    localStorage.removeItem(TOUR_UPDATED_AT_KEY);
  }

  localStorage.setItem(TOUR_STATUS_KEY, JSON.stringify(status));
  return status;
}

export function markProductTourCompleted() {
  return writeProductTourStatus({
    hasCompletedTour: true,
    tourCompletedAt: new Date().toISOString(),
    tourSkippedAt: null,
    tourStepIndex: 0,
    tourStepId: null,
    tourUpdatedAt: new Date().toISOString(),
  });
}

export function markProductTourSkipped() {
  const current = readProductTourStatus();
  return writeProductTourStatus({
    hasCompletedTour: current.hasCompletedTour,
    tourCompletedAt: current.tourCompletedAt,
    tourSkippedAt: new Date().toISOString(),
    tourStepIndex: current.tourStepIndex,
    tourStepId: current.tourStepId,
    tourUpdatedAt: new Date().toISOString(),
  });
}

export function markProductTourProgress(stepIndex, stepId = null) {
  return writeProductTourStatus({
    hasCompletedTour: false,
    tourCompletedAt: null,
    tourSkippedAt: null,
    tourStepIndex: Math.max(0, Number(stepIndex || 0)),
    tourStepId: stepId,
    tourUpdatedAt: new Date().toISOString(),
  });
}

export function resetProductTourStatus() {
  if (!canUseStorage()) return emptyTourStatus;

  localStorage.removeItem(TOUR_COMPLETED_KEY);
  localStorage.removeItem(TOUR_COMPLETED_AT_KEY);
  localStorage.removeItem(TOUR_SKIPPED_AT_KEY);
  localStorage.removeItem(TOUR_STEP_INDEX_KEY);
  localStorage.removeItem(TOUR_STEP_ID_KEY);
  localStorage.removeItem(TOUR_UPDATED_AT_KEY);
  localStorage.removeItem(TOUR_STATUS_KEY);
  return emptyTourStatus;
}
