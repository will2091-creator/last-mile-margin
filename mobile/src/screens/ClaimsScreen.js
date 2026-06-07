import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { currency } from "../theme";
import { useTheme } from "../ThemeContext";
import { loadClaimsCenter, loadTeamMembership, updateClaimStatus } from "../lib/mobileRepository";
import { getRoleCapabilities, getRoleLabel, normalizeRole } from "../lib/roles";

const claimTabs = ["Needs Review", "Waiting on Evidence", "Dispute Ready", "Resolved"];

export default function ClaimsScreen({ refreshToken, onDataChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [claims, setClaims] = useState([]);
  const [membership, setMembership] = useState(null);
  const [activeTab, setActiveTab] = useState("Needs Review");
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [status, setStatus] = useState("Loading claims center...");
  const [isUpdating, setIsUpdating] = useState("");

  useEffect(() => {
    let isMounted = true;
    Promise.all([loadClaimsCenter(), loadTeamMembership()]).then(([result, membershipResult]) => {
      if (!isMounted) return;
      if (result.ok) {
        setClaims(result.claims);
        setStatus(`${result.claims.length} claim${result.claims.length === 1 ? "" : "s"} loaded.`);
        setSelectedClaimId((current) => current || result.claims[0]?.id || null);
      } else {
        setStatus(result.error);
      }
      if (membershipResult.ok) setMembership(membershipResult.membership);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const role = normalizeRole(membership?.role);
  const roleLabel = getRoleLabel(role);
  const capabilities = getRoleCapabilities(role);
  const allowedStatuses = capabilities.claimStatuses;
  const groupedClaims = useMemo(() => groupClaims(claims), [claims]);
  const visibleClaims = groupedClaims[activeTab] || [];
  const selectedClaim = claims.find((claim) => claim.id === selectedClaimId) || visibleClaims[0] || claims[0] || null;
  const exposure = visibleClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  const setStatusForClaim = async (claim, nextStatus) => {
    if (!allowedStatuses.includes(nextStatus)) {
      setStatus(`${roleLabel} cannot move claims to ${nextStatus}.`);
      return;
    }

    setIsUpdating(claim.id);
    const result = await updateClaimStatus(claim.id, nextStatus);
    setIsUpdating("");
    if (result.ok) {
      setStatus(`${claim.id} moved to ${nextStatus}.`);
      onDataChange?.();
    } else {
      setStatus(result.error);
    }
  };

  const nextAction = selectedClaim ? getNextAction(selectedClaim) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Claims Center</Text>
        <Text style={styles.title}>Control money leaks</Text>
        <View style={styles.headerMetrics}>
          <Metric label="Open Risk" value={currency.format(claims.filter((claim) => classifyClaim(claim) !== "Resolved").reduce((sum, claim) => sum + Number(claim.amount || 0), 0))} tone="red" />
          <Metric label="This View" value={currency.format(exposure)} tone={exposure ? "red" : "green"} />
        </View>
      </View>

      <View style={styles.tabs}>
        {claimTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={[styles.tab, isActive && styles.activeTab]} onPress={() => {
              setActiveTab(tab);
              setSelectedClaimId((groupedClaims[tab] || [])[0]?.id || null);
            }}>
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              <Text style={[styles.tabCount, isActive && styles.activeTabText]}>{groupedClaims[tab]?.length || 0}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedClaim && (
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Next Action</Text>
              <Text style={styles.detailTitle}>{nextAction.label}</Text>
              <Text style={styles.detailNote}>{nextAction.note}</Text>
            </View>
            <TouchableOpacity
              disabled={isUpdating === selectedClaim.id || !nextAction.status}
              style={[styles.primaryAction, (!nextAction.status || isUpdating === selectedClaim.id) && styles.disabledAction]}
              onPress={() => setStatusForClaim(selectedClaim, nextAction.status)}
            >
              {isUpdating === selectedClaim.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>{nextAction.button}</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.detailGrid}>
            <Detail label="Claim Amount" value={currency.format(Number(selectedClaim.amount || 0))} tone="red" />
            <Detail label="Driver" value={selectedClaim.driver || "No driver"} />
            <Detail label="Retailer" value={getRetailer(selectedClaim)} />
            <Detail label="Date" value={formatDate(selectedClaim.date)} />
            <Detail label="Status" value={selectedClaim.status || "Open"} />
            <Detail label="Days Open" value={`${getDaysOpen(selectedClaim.date)} days`} tone={getDaysOpen(selectedClaim.date) > 7 ? "red" : "amber"} />
          </View>

          <View style={styles.evidenceBox}>
            <Text style={styles.evidenceTitle}>Evidence</Text>
            <Text style={styles.evidenceCopy}>{getEvidenceMessage(selectedClaim)}</Text>
          </View>

          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>Timeline</Text>
            {buildTimeline(selectedClaim).map((item) => (
              <View key={item} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.status}>{status}</Text>

      {visibleClaims.map((claim) => (
        <TouchableOpacity key={claim.id} style={[styles.claimCard, selectedClaim?.id === claim.id && styles.selectedClaimCard]} onPress={() => setSelectedClaimId(claim.id)}>
          <View style={styles.claimTop}>
            <View style={styles.claimMain}>
              <Text style={styles.claimAmount}>{currency.format(Number(claim.amount || 0))}</Text>
              <Text style={styles.claimMeta}>{claim.driver || "No driver"} · {getRetailer(claim)}</Text>
            </View>
            <RiskBadge risk={claim.risk} />
          </View>
          <View style={styles.claimFooter}>
            <Text style={styles.claimStatus}>{claim.status || "Open"}</Text>
            <Text style={styles.claimDays}>{getDaysOpen(claim.date)} Days Open</Text>
          </View>
        </TouchableOpacity>
      ))}

      {!visibleClaims.length && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No claims here</Text>
          <Text style={styles.emptyCopy}>This queue is clear. Switch tabs to review other claim stages.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function groupClaims(claims) {
  return claimTabs.reduce((groups, tab) => {
    groups[tab] = claims.filter((claim) => classifyClaim(claim) === tab);
    return groups;
  }, {});
}

function classifyClaim(claim) {
  const text = `${claim.status || ""} ${claim.type || ""} ${claim.category || ""}`.toLowerCase();
  if (/closed|resolved/.test(text)) return "Resolved";
  if (/dispute|under review|reviewed|ready/.test(text)) return "Dispute Ready";
  if (/evidence|photo|missing|invoice|waiting/.test(text)) return "Waiting on Evidence";
  return "Needs Review";
}

function getNextAction(claim) {
  const group = classifyClaim(claim);
  if (group === "Waiting on Evidence") return { label: "Request Photos", note: "The owner needs proof before deciding whether to dispute or accept the claim.", button: "Mark Review", status: "Under Review" };
  if (group === "Dispute Ready") return { label: "Submit Dispute", note: "Evidence is ready. Move the claim toward resolution and protect margin.", button: "Close Claim", status: "Closed" };
  if (group === "Resolved") return { label: "Closed", note: "This claim is no longer active. Review the timeline if needed.", button: "Closed", status: null };
  return { label: "Review Evidence", note: "Check driver, amount, retailer, risk level, and what proof is missing.", button: "Start Review", status: "Under Review" };
}

function getRetailer(claim) {
  return claim.category || claim.route || claim.team || "Retailer";
}

function getDaysOpen(value) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.ceil((Date.now() - date.getTime()) / 86400000));
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function getEvidenceMessage(claim) {
  if (classifyClaim(claim) === "Waiting on Evidence") return "Photos, invoice, or delivery notes are still needed.";
  if (classifyClaim(claim) === "Dispute Ready") return "Evidence has enough context for the owner to decide.";
  return "Review available photos, notes, invoice, and driver statement.";
}

function buildTimeline(claim) {
  return [
    `Claim opened ${formatDate(claim.date)}`,
    `${claim.driver || "Driver"} assigned`,
    `${claim.status || "Open"} status`,
  ];
}

function Metric({ label, value, tone }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, styles[`${tone}Text`] || styles.inkText]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function Detail({ label, value, tone = "ink" }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailItemLabel}>{label}</Text>
      <Text style={[styles.detailItemValue, styles[`${tone}Text`] || styles.inkText]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function RiskBadge({ risk }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const normalized = risk || "Medium";
  const style = normalized === "High" ? styles.highRisk : normalized === "Low" ? styles.lowRisk : styles.mediumRisk;
  return <Text style={[styles.riskBadge, style]}>{normalized} Risk</Text>;
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  kicker: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 3,
  },
  headerMetrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  metric: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 11,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 19,
    fontWeight: "900",
    marginTop: 5,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tab: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  tabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  tabCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  activeTabText: {
    color: "#fff",
  },
  detailCard: {
    backgroundColor: colors.card,
    borderColor: "#bfdbfe",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  detailTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  detailCopy: {
    flex: 1,
  },
  detailLabel: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  detailNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.blue,
    borderRadius: 14,
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabledAction: {
    opacity: 0.55,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  detailItem: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    padding: 10,
  },
  detailItemLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailItemValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  evidenceBox: {
    backgroundColor: colors.card,
    borderColor: "#bfdbfe",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  evidenceTitle: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  evidenceCopy: {
    color: colors.ink,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 4,
  },
  timeline: {
    marginTop: 12,
  },
  timelineTitle: {
    color: colors.ink,
    fontWeight: "900",
    marginBottom: 6,
  },
  timelineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 5,
  },
  timelineDot: {
    backgroundColor: colors.blue,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  timelineText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  status: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  claimCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  selectedClaimCard: {
    borderColor: colors.blue,
  },
  claimTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  claimMain: {
    flex: 1,
  },
  claimAmount: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
  },
  claimMeta: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: 4,
  },
  riskBadge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  highRisk: {
    backgroundColor: "#fee2e2",
    color: colors.red,
  },
  mediumRisk: {
    backgroundColor: "#fef3c7",
    color: colors.amber,
  },
  lowRisk: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  claimFooter: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
  },
  claimStatus: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  claimDays: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  emptyCopy: {
    color: colors.muted,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 5,
    textAlign: "center",
  },
  inkText: {
    color: colors.ink,
  },
  redText: {
    color: colors.red,
  },
  amberText: {
    color: colors.amber,
  },
  greenText: {
    color: colors.green,
  },
});
