import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { currency, theme } from "../theme";
import { loadOpenClaims, loadTeamMembership } from "../lib/mobileRepository";
import { getRoleDescription, getRoleLabel, normalizeRole } from "../lib/roles";

export default function HomeScreen({ refreshToken }) {
  const [claims, setClaims] = useState([]);
  const [membership, setMembership] = useState(null);
  const [status, setStatus] = useState("Loading field snapshot...");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [claimsResult, membershipResult] = await Promise.all([loadOpenClaims(), loadTeamMembership()]);
      if (!isMounted) return;

      if (claimsResult.ok) setClaims(claimsResult.claims);
      if (membershipResult.ok) setMembership(membershipResult.membership);

      setStatus(claimsResult.ok ? "Live Supabase data loaded." : claimsResult.error);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const totalExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const highRiskClaims = claims.filter((claim) => claim.risk === "High").length;
  const role = normalizeRole(membership?.role);
  const roleLabel = getRoleLabel(role);
  const roleDescription = getRoleDescription(role);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <View style={styles.grid}>
        <MetricCard title="Open Claims" value={claims.length} note={currency.format(totalExposure)} />
        <MetricCard title="High Risk" value={highRiskClaims} note="Needs packet review" />
        <MetricCard title="Role" value={roleLabel} note={membership?.status || "active"} />
      </View>
      <View style={styles.roleCard}>
        <Text style={styles.roleTitle}>{roleLabel} mobile access</Text>
        <Text style={styles.roleCopy}>{roleDescription}</Text>
        {membership?.isFallbackOwner && (
          <Text style={styles.roleHint}>Owner fallback is active because this login owns the workspace but does not have a linked team membership row yet.</Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s field focus</Text>
        {claims.slice(0, 3).map((claim) => (
          <View key={claim.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{claim.id} · {claim.type}</Text>
              <Text style={styles.rowNote}>{claim.team || "Unassigned"} · {claim.driver || "No driver"}</Text>
            </View>
            <Text style={styles.amount}>{currency.format(Number(claim.amount || 0))}</Text>
          </View>
        ))}
        {!claims.length && <ActivityIndicator color={theme.colors.blue} />}
      </View>
    </ScrollView>
  );
}

function MetricCard({ title, value, note }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricNote}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  status: {
    color: theme.colors.muted,
    fontWeight: "800",
  },
  grid: {
    gap: 12,
  },
  metricCard: {
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
    padding: 16,
  },
  metricTitle: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 8,
    color: theme.colors.ink,
    fontSize: 30,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  metricNote: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "800",
  },
  roleCard: {
    borderColor: "#bfdbfe",
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#eff6ff",
    padding: 16,
  },
  roleTitle: {
    color: theme.colors.blue,
    fontSize: 17,
    fontWeight: "900",
  },
  roleCopy: {
    color: theme.colors.ink,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 6,
  },
  roleHint: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10,
  },
  card: {
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
    padding: 16,
  },
  cardTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  row: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 13,
  },
  rowTitle: {
    color: theme.colors.ink,
    fontWeight: "900",
  },
  rowNote: {
    color: theme.colors.muted,
    fontWeight: "700",
    marginTop: 3,
  },
  amount: {
    color: theme.colors.red,
    fontWeight: "900",
  },
});
