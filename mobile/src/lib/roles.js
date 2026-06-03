export const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
};

export const roleDescriptions = {
  owner: "Full control of web, mobile, roles, claims, and settings.",
  admin: "Can manage operations, claims, teams, and most settings.",
  dispatcher: "Can manage routes, check-ins, evidence, and claim workflow.",
  driver: "Can check in, upload evidence, and move claims into review.",
};

export const roleCapabilities = {
  owner: {
    claimStatuses: ["Under Review", "Open", "Closed"],
    canUploadEvidence: true,
    canCheckIn: true,
    canCloseClaims: true,
  },
  admin: {
    claimStatuses: ["Under Review", "Open", "Closed"],
    canUploadEvidence: true,
    canCheckIn: true,
    canCloseClaims: true,
  },
  dispatcher: {
    claimStatuses: ["Under Review", "Open"],
    canUploadEvidence: true,
    canCheckIn: true,
    canCloseClaims: false,
  },
  driver: {
    claimStatuses: ["Under Review"],
    canUploadEvidence: true,
    canCheckIn: true,
    canCloseClaims: false,
  },
};

export function normalizeRole(role) {
  return Object.prototype.hasOwnProperty.call(roleLabels, role) ? role : "driver";
}

export function getRoleLabel(role) {
  return roleLabels[normalizeRole(role)];
}

export function getRoleDescription(role) {
  return roleDescriptions[normalizeRole(role)];
}

export function getRoleCapabilities(role) {
  return roleCapabilities[normalizeRole(role)];
}
