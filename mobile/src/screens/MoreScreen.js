import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import { loadOwnerCommandCenter } from "../lib/mobileRepository";

export default function MoreScreen({ refreshToken }) {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("Loading owner tools...");

  useEffect(() => {
    let isMounted = true;
    loadOwnerCommandCenter().then((result) => {
      if (!isMounted) return;
      if (result.ok) {
        setSummary(result.summary);
        setStatus("Owner tools ready.");
      } else {
        setStatus(result.error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const pendingReceipts = summary?.pendingReceipts?.length || 0;
  const missingDocs = summary?.missingDocs?.length || 0;
  const savedReports = summary?.savedDays?.length || 0;

  const items = [
    {
      title: "Reports",
      subtitle: `${savedReports} saved daily snapshots`,
      outcome: "Review profit history and export decisions.",
      tone: "blue",
    },
    {
      title: "Compliance",
      subtitle: `${missingDocs} document${missingDocs === 1 ? "" : "s"} need review`,
      outcome: "Protect routes from audit and insurance issues.",
      tone: missingDocs ? "red" : "green",
    },
    {
      title: "Contracts",
      subtitle: "Rates, stop pay, renewals",
      outcome: "Keep revenue terms accurate before profit is calculated.",
      tone: "blue",
    },
    {
      title: "Documents",
      subtitle: `${pendingReceipts} receipt${pendingReceipts === 1 ? "" : "s"} pending plus compliance files`,
      outcome: "Find receipts, driver docs, contracts, and proof.",
      tone: pendingReceipts ? "amber" : "green",
    },
    {
      title: "Settings",
      subtitle: "Workspace, account, and permissions",
      outcome: "Control how the mobile owner app behaves.",
      tone: "blue",
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>More</Text>
        <Text style={styles.title}>Owner tools</Text>
        <Text style={styles.copy}>{status}</Text>
        <Text style={styles.note}>
          Full management for these lives in the web dashboard. Here&apos;s the live status from your workspace.
        </Text>
      </View>

      {items.map((item) => (
        <View key={item.title} style={styles.toolCard}>
          <View style={[styles.toolMark, styles[`${item.tone}Mark`] || styles.blueMark]} />
          <View style={styles.toolCopy}>
            <Text style={styles.toolTitle}>{item.title}</Text>
            <Text style={styles.toolSubtitle}>{item.subtitle}</Text>
            <Text style={styles.toolOutcome}>{item.outcome}</Text>
          </View>
          <View style={styles.webTag}>
            <Text style={styles.webTagText}>On web</Text>
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
  note: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 8,
  },
  toolCard: {
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    padding: 14,
  },
  toolMark: {
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  blueMark: {
    backgroundColor: theme.colors.blue,
  },
  greenMark: {
    backgroundColor: theme.colors.green,
  },
  amberMark: {
    backgroundColor: theme.colors.amber,
  },
  redMark: {
    backgroundColor: theme.colors.red,
  },
  toolCopy: {
    flex: 1,
  },
  toolTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  toolSubtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3,
  },
  toolOutcome: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 4,
  },
  webTag: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  webTagText: {
    color: theme.colors.blue,
    fontSize: 11,
    fontWeight: "900",
  },
});
