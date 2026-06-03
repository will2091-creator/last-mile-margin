import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { currency, theme } from "../theme";
import { loadOpenClaims, updateClaimStatus } from "../lib/mobileRepository";

export default function ClaimsScreen({ refreshToken, onDataChange }) {
  const [claims, setClaims] = useState([]);
  const [status, setStatus] = useState("Loading claims...");
  const [isUpdating, setIsUpdating] = useState("");

  useEffect(() => {
    let isMounted = true;
    loadOpenClaims().then((result) => {
      if (!isMounted) return;
      if (result.ok) {
        setClaims(result.claims);
        setStatus(`${result.claims.length} open claim${result.claims.length === 1 ? "" : "s"} loaded.`);
      } else {
        setStatus(result.error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const setStatusForClaim = async (claimId, nextStatus) => {
    setIsUpdating(claimId);
    const result = await updateClaimStatus(claimId, nextStatus);
    setIsUpdating("");
    if (result.ok) {
      onDataChange();
    } else {
      setStatus(result.error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.status}>{status}</Text>
      {claims.map((claim) => (
        <View key={claim.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.claimTitle}>{claim.type}</Text>
              <Text style={styles.claimMeta}>{claim.id} · {claim.team || "Unassigned"} · {claim.driver || "No driver"}</Text>
            </View>
            <Text style={styles.amount}>{currency.format(Number(claim.amount || 0))}</Text>
          </View>
          <View style={styles.badges}>
            <Text style={[styles.badge, claim.risk === "High" ? styles.highRisk : styles.mediumRisk]}>{claim.risk || "Risk"}</Text>
            <Text style={styles.badge}>{claim.status}</Text>
            <Text style={styles.badge}>{claim.preventable || "Unknown"}</Text>
          </View>
          <View style={styles.actions}>
            {["Under Review", "Open", "Closed"].map((nextStatus) => (
              <TouchableOpacity key={nextStatus} style={styles.actionButton} onPress={() => setStatusForClaim(claim.id, nextStatus)}>
                {isUpdating === claim.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>{nextStatus}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 24,
  },
  status: {
    color: theme.colors.muted,
    fontWeight: "800",
  },
  card: {
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  claimTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  claimMeta: {
    color: theme.colors.muted,
    fontWeight: "700",
    marginTop: 4,
  },
  amount: {
    color: theme.colors.red,
    fontWeight: "900",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: "#eef2f7",
    color: theme.colors.muted,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "900",
  },
  highRisk: {
    backgroundColor: "#fee2e2",
    color: theme.colors.red,
  },
  mediumRisk: {
    backgroundColor: "#fef3c7",
    color: theme.colors.amber,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: theme.colors.blue,
    paddingVertical: 10,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
});
