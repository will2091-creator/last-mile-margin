const TOUR_COMPLETED_KEY = "hasCompletedTour";
const TOUR_COMPLETED_AT_KEY = "tourCompletedAt";
const TOUR_SKIPPED_AT_KEY = "tourSkippedAt";
const TOUR_STATUS_KEY = "finalMileProductTourStatus";

const emptyTourStatus = {
  hasCompletedTour: false,
  tourCompletedAt: null,
  tourSkippedAt: null,
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

  localStorage.setItem(TOUR_STATUS_KEY, JSON.stringify(status));
  return status;
}

export function markProductTourCompleted() {
  return writeProductTourStatus({
    hasCompletedTour: true,
    tourCompletedAt: new Date().toISOString(),
    tourSkippedAt: null,
  });
}

export function markProductTourSkipped() {
  const current = readProductTourStatus();
  return writeProductTourStatus({
    hasCompletedTour: current.hasCompletedTour,
    tourCompletedAt: current.tourCompletedAt,
    tourSkippedAt: new Date().toISOString(),
  });
}

export function resetProductTourStatus() {
  if (!canUseStorage()) return emptyTourStatus;

  localStorage.removeItem(TOUR_COMPLETED_KEY);
  localStorage.removeItem(TOUR_COMPLETED_AT_KEY);
  localStorage.removeItem(TOUR_SKIPPED_AT_KEY);
  localStorage.removeItem(TOUR_STATUS_KEY);
  return emptyTourStatus;
}
