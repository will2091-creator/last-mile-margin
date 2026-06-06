import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { currency, theme } from "../theme";
import { loadClaimsCenter, loadOwnerCommandCenter } from "../lib/mobileRepository";

export default function TeamScreen({ refreshToken }) {
  const [summary, setSummary] = useState(null);
  const [claims, setClaims] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [status, setStatus] = useState("Loading team view...");

  useEffect(() => {
    let isMounted = true;
    Promise.all([loadOwnerCommandCenter(), loadClaimsCenter()]).then(([ownerResult, claimsResult]) => {
      if (!isMounted) return;
      if (ownerResult.ok) {
        setSummary(ownerResult.summary);
        setSelectedMemberId((current) => current || ownerResult.summary?.teamMembers?.[0]?.id || null);
      }
      if (claimsResult.ok) setClaims(claimsResult.claims);
      setStatus(ownerResult.ok ? "Team performance loaded." : ownerResult.error);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const members = summary?.teamMembers || [];
  const checkIns = summary?.checkIns || [];
  const selectedMember = members.find((member) => member.id === selectedMemberId) || members[0] || null;
  const checkedInUserIds = new Set(checkIns.map((item) => item.user_id).filter(Boolean));
  const drivers = members.filter((member) => /driver|owner|admin/i.test(member.role || ""));
  const helpers = members.filter((member) => /helper/i.test(member.role || ""));
  const trucks = new Set(checkIns.map((item) => item.truck).filter(Boolean));
  const needsReview = members.filter((member) => member.user_id && !checkedInUserIds.has(member.user_id));
  const latestRevenue = Number(summary?.latestDay?.revenue || 0);
  const selectedClaims = selectedMember ? claims.filter((claim) => {
    const label = `${claim.driver || ""} ${claim.team || ""}`.toLowerCase();
    return label.includes(String(selectedMember.display_name || selectedMember.email || "").toLowerCase().split("@")[0]);
  }) : [];
  const assignedRoutes = selectedMember ? checkIns.filter((item) => item.user_id === selectedMember.user_id) : [];
  const revenuePerActive = members.length ? latestRevenue / members.length : 0;

  const cards = [
    ["Drivers", drivers.length, `${needsReview.length} needs review`, "blue"],
    ["Helpers", helpers.length, "Support capacity", "green"],
    ["Teams", members.length, `${summary?.checkedInCount || 0} checked in`, "green"],
    ["Trucks", trucks.size || "None", "Today’s check-ins", "amber"],
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Team</Text>
        <Text style={styles.title}>People doing the work</Text>
        <Text style={styles.copy}>{status}</Text>
      </View>

      <View style={styles.cardGrid}>
        {cards.map(([label, value, note, tone]) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, styles[`${tone}Text`] || styles.inkText]}>{value}</Text>
            <Text style={styles.statNote}>{note}</Text>
          </View>
        ))}
      </View>

      {selectedMember && (
        <View style={styles.detailCard}>
          <Text style={styles.detailKicker}>Performance Summary</Text>
          <Text style={styles.detailTitle}>{selectedMember.display_name || selectedMember.email || "Team member"}</Text>
          <View style={styles.detailGrid}>
            <Detail label="Revenue Generated" value={latestRevenue ? currency.format(revenuePerActive) : "Not saved"} tone="green" />
            <Detail label="Claims Count" value={selectedClaims.length} tone={selectedClaims.length ? "red" : "green"} />
            <Detail label="Compliance" value={needsReview.some((member) => member.id === selectedMember.id) ? "Needs Review" : "Ready"} tone={needsReview.some((member) => member.id === selectedMember.id) ? "amber" : "green"} />
            <Detail label="Assigned Routes" value={assignedRoutes.map((item) => item.route_name).filter(Boolean).join(", ") || "No check-in"} />
          </View>
          <Text style={styles.nextAction}>
            Next action: {needsReview.some((member) => member.id === selectedMember.id) ? "Confirm readiness before dispatch." : "Keep this team running as assigned."}
          </Text>
        </View>
      )}

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Drivers and contractors</Text>
        {members.map((member) => {
          const isActive = member.id === selectedMember?.id;
          const checkedIn = member.user_id && checkedInUserIds.has(member.user_id);
          return (
            <TouchableOpacity key={member.id} style={[styles.memberRow, isActive && styles.activeMemberRow]} onPress={() => setSelectedMemberId(member.id)}>
              <View style={styles.memberCopy}>
                <Text style={styles.memberName}>{member.display_name || member.email || "Team member"}</Text>
                <Text style={styles.memberRole}>{member.role || "Driver"} · {member.status || "active"}</Text>
              </View>
              <Text style={[styles.memberBadge, checkedIn ? styles.readyBadge : styles.reviewBadge]}>{checkedIn ? "Ready" : "Review"}</Text>
            </TouchableOpacity>
          );
        })}
        {!members.length && <Text style={styles.emptyText}>No team members found yet.</Text>}
      </View>
    </ScrollView>
  );
}

function Detail({ label, value, tone = "ink" }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, styles[`${tone}Text`] || styles.inkText]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  kicker: {
    color: theme.colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 3,
  },
  copy: {
    color: theme.colors.muted,
    fontWeight: "800",
    marginTop: 4,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    padding: 13,
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statValue: {
    color: theme.colors.ink,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6,
  },
  statNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: theme.colors.card,
    borderColor: "#bfdbfe",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  detailKicker: {
    color: theme.colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  detailItem: {
    backgroundColor: "#f8fafc",
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    padding: 10,
  },
  detailLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailValue: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  nextAction: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    color: theme.colors.ink,
    fontWeight: "900",
    lineHeight: 20,
    marginTop: 12,
    padding: 11,
  },
  listCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  memberRow: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
  },
  activeMemberRow: {
    backgroundColor: "#f8fafc",
  },
  memberCopy: {
    flex: 1,
  },
  memberName: {
    color: theme.colors.ink,
    fontWeight: "900",
  },
  memberRole: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  memberBadge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  readyBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  reviewBadge: {
    backgroundColor: "#fef3c7",
    color: theme.colors.amber,
  },
  emptyText: {
    color: theme.colors.muted,
    fontWeight: "800",
    paddingVertical: 10,
  },
  inkText: {
    color: theme.colors.ink,
  },
  blueText: {
    color: theme.colors.blue,
  },
  greenText: {
    color: theme.colors.green,
  },
  redText: {
    color: theme.colors.red,
  },
  amberText: {
    color: theme.colors.amber,
  },
});
