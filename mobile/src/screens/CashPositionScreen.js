import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { currency } from "../theme";
import { useTheme } from "../ThemeContext";
import { loadCashPosition } from "../lib/mobileRepository";
import { computeCashPositionSummary, computeEarlyPayPreview, centsToDollars } from "../lib/cashPosition";
import { mockReceivables, mockDriverSettlements, financingDefaults } from "../data/cashPositionMockData";

const fmt = (cents) => currency.format(centsToDollars(cents));
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const AGING_BUCKETS = [
  { key: "b0_15", label: "0–15 days", tone: "green" },
  { key: "b16_30", label: "16–30 days", tone: "blue" },
  { key: "b31_45", label: "31–45 days", tone: "amber" },
  { key: "b45_plus", label: "45+ days", tone: "red" },
];

export default function CashPositionScreen({ refreshToken }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Seed synchronously from the offline mock so the screen always renders, then
  // merge real rows when Supabase is configured + the schema has been deployed.
  const [data, setData] = useState(() => ({
    receivables: mockReceivables,
    driverSettlements: mockDriverSettlements,
    financingRates: financingDefaults,
  }));
  const [source, setSource] = useState("demo"); // "demo" | "live"

  useEffect(() => {
    let mounted = true;
    loadCashPosition().then((result) => {
      if (!mounted) return;
      if (result.ok && result.receivables.length) {
        setData({
          receivables: result.receivables,
          driverSettlements: result.driverSettlements,
          financingRates: result.financingRates,
        });
        setSource("live");
      }
    });
    return () => {
      mounted = false;
    };
  }, [refreshToken]);

  const summary = useMemo(
    () => computeCashPositionSummary(data.receivables, data.driverSettlements),
    [data.receivables, data.driverSettlements]
  );
  const earlyPay = useMemo(
    () => computeEarlyPayPreview(data.receivables, data.financingRates),
    [data.receivables, data.financingRates]
  );

  const verifiedShare = pct(summary.verifiedCents, summary.totalOwedCents);
  const pendingShare = summary.totalOwedCents > 0 ? 100 - verifiedShare : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Finance · Cash Position</Text>
        <Text style={styles.title}>What you're owed</Text>
        <Text style={styles.headerCopy}>
          What you're owed, when it's due, and how much is early-pay eligible — from your receivables and
          driver settlements. Read-only: no funds move here.
        </Text>
        <View style={styles.chipRow}>
          <Text style={[styles.chip, styles.chipNeutral]}>Preview only</Text>
          <Text style={[styles.chip, source === "live" ? styles.chipLive : styles.chipNeutral]}>
            {source === "live" ? "Live data" : "Demo data"}
          </Text>
        </View>
      </View>

      {/* Primary KPIs */}
      <View style={styles.kpiGrid}>
        <KpiTile
          label="Total outstanding"
          value={fmt(summary.totalOwedCents)}
          note={`${summary.receivableCount} open receivable${summary.receivableCount === 1 ? "" : "s"}`}
        />
        <KpiTile
          label="Verified / invoiced"
          value={fmt(summary.verifiedCents)}
          note={`${verifiedShare}% of outstanding`}
          tone="green"
        />
        <KpiTile
          label="Pending verification"
          value={fmt(summary.pendingCents)}
          note={`${pendingShare}% of outstanding`}
          tone="amber"
        />
        <KpiTile
          label="Net owed to drivers"
          value={fmt(summary.driverNetOwedCents)}
          note={`${summary.driverSettlementCount} unpaid settlement${summary.driverSettlementCount === 1 ? "" : "s"}`}
        />
      </View>

      {/* Receivables aging */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Receivables aging</Text>
        <Text style={styles.cardSubtitle}>Outstanding by expected pay date</Text>
        <View style={styles.agingList}>
          {AGING_BUCKETS.map((b) => {
            const amt = summary.buckets[b.key] || 0;
            const width = pct(amt, summary.totalOwedCents);
            return (
              <View key={b.key} style={styles.agingRow}>
                <View style={styles.agingTop}>
                  <Text style={styles.agingLabel}>{b.label}</Text>
                  <Text style={styles.agingAmount} numberOfLines={1}>
                    {fmt(amt)} <Text style={styles.agingPct}>· {width}%</Text>
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${width}%`, backgroundColor: colors[b.tone] }]} />
                </View>
              </View>
            );
          })}
        </View>

        {(summary.disputedCents > 0 || summary.paidCents > 0) && (
          <View style={styles.miniRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniLabel}>Disputed (at risk)</Text>
              <Text style={[styles.miniValue, { color: colors.red }]} numberOfLines={1} adjustsFontSizeToFit>
                {fmt(summary.disputedCents)}
              </Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniLabel}>Collected (paid)</Text>
              <Text style={[styles.miniValue, { color: colors.green }]} numberOfLines={1} adjustsFontSizeToFit>
                {fmt(summary.paidCents)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Verified vs pending */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verified vs pending</Text>
        <Text style={styles.cardSubtitle}>Confidence in what you're owed</Text>

        <Text style={styles.bigTotal} numberOfLines={1} adjustsFontSizeToFit>
          {fmt(summary.totalOwedCents)}
        </Text>
        <Text style={styles.cardSubtitle}>total outstanding</Text>

        <View style={styles.splitBar}>
          <View style={[styles.splitSeg, { width: `${verifiedShare}%`, backgroundColor: colors.green }]} />
          <View style={[styles.splitSeg, { width: `${pendingShare}%`, backgroundColor: colors.amber }]} />
        </View>

        <View style={styles.splitRows}>
          <SplitRow dotColor={colors.green} label="Verified / invoiced" value={fmt(summary.verifiedCents)} share={verifiedShare} />
          <SplitRow dotColor={colors.amber} label="Pending verification" value={fmt(summary.pendingCents)} share={pendingShare} />
        </View>
      </View>

      {/* Early Pay eligible — preview only */}
      <View style={styles.earlyCard}>
        <View style={styles.earlyHead}>
          <Text style={styles.earlyTitle}>Early Pay eligible</Text>
          <Text style={styles.earlyPill}>Preview</Text>
        </View>
        <Text style={styles.earlyCopy}>
          An estimate of what you could advance against verified, invoiced, and completed receivables. This is a
          preview — no funds move and nothing is created.
        </Text>

        <View style={styles.kpiGrid}>
          <EarlyTile label="Eligible amount" value={fmt(earlyPay.eligibleAmountCents)} note={`${earlyPay.eligibleCount} receivable${earlyPay.eligibleCount === 1 ? "" : "s"}`} />
          <EarlyTile label="Advanceable now" value={fmt(earlyPay.advanceableCents)} note={`${Math.round(earlyPay.advanceRate * 100)}% advance rate`} emphasize />
          <EarlyTile label="Preview fee" value={fmt(earlyPay.previewFeeCents)} note={`${Math.round(earlyPay.feeRate * 100)}% fee`} />
          <EarlyTile label="Net funding" value={fmt(earlyPay.netFundingCents)} note="estimated to your account" />
        </View>

        <Text style={styles.earlyFinePrint}>
          Read-only analytics over your internal data. No payment provider, no card program, no transfer.
        </Text>
        <TouchableOpacity disabled style={styles.disabledCta} activeOpacity={1}>
          <Text style={styles.disabledCtaText}>Request Advance (coming soon)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        {source === "live" ? "Showing live data from your workspace." : "Showing demo data."} Cash Position is a
        read-only, system-of-record view.
      </Text>
    </ScrollView>
  );
}

function KpiTile({ label, value, note, tone = "ink" }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.kpiTile}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, styles[`${tone}Text`] || styles.inkText]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.kpiNote} numberOfLines={1}>{note}</Text>
    </View>
  );
}

function SplitRow({ dotColor, label, value, share }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.splitRow}>
      <View style={styles.splitLeft}>
        <View style={[styles.splitDot, { backgroundColor: dotColor }]} />
        <Text style={styles.splitLabel}>{label}</Text>
      </View>
      <Text style={styles.splitValue} numberOfLines={1}>
        {value} <Text style={styles.splitShare}>· {share}%</Text>
      </Text>
    </View>
  );
}

function EarlyTile({ label, value, note, emphasize }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.kpiTile, emphasize && styles.earlyTileEmphasis]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, styles.earlyValue, styles.inkText]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.kpiNote} numberOfLines={1}>{note}</Text>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      gap: 12,
      paddingBottom: 24,
    },
    headerCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
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
    headerCopy: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
      marginTop: 6,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    chip: {
      borderRadius: 999,
      fontSize: 11,
      fontWeight: "900",
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    chipNeutral: {
      backgroundColor: colors.background,
      color: colors.muted,
    },
    chipLive: {
      backgroundColor: colors.blue,
      color: "#fff",
    },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    kpiTile: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexBasis: "47%",
      flexGrow: 1,
      padding: 13,
    },
    kpiLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    kpiValue: {
      fontSize: 22,
      fontWeight: "900",
      marginTop: 6,
    },
    // Early-pay tiles sit inside the padded earlyCard, so they're narrower than
    // the top KPI grid. RN's adjustsFontSizeToFit shrinks oversized amounts on
    // native but is a no-op on react-native-web, so size these to fit the
    // worst-case value ($20,005.50) without it.
    earlyValue: {
      fontSize: 18,
    },
    kpiNote: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
    },
    cardTitle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: "900",
    },
    cardSubtitle: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 2,
    },
    agingList: {
      gap: 14,
      marginTop: 14,
    },
    agingRow: {
      gap: 7,
    },
    agingTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    agingLabel: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900",
    },
    agingAmount: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900",
    },
    agingPct: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
    },
    track: {
      backgroundColor: colors.background,
      borderRadius: 999,
      height: 9,
      overflow: "hidden",
      width: "100%",
    },
    fill: {
      borderRadius: 999,
      height: "100%",
    },
    miniRow: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      paddingTop: 12,
    },
    miniStat: {
      flex: 1,
    },
    miniLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    miniValue: {
      fontSize: 17,
      fontWeight: "900",
      marginTop: 4,
    },
    bigTotal: {
      color: colors.ink,
      fontSize: 34,
      fontWeight: "900",
      marginTop: 14,
    },
    splitBar: {
      backgroundColor: colors.background,
      borderRadius: 999,
      flexDirection: "row",
      height: 12,
      marginTop: 14,
      overflow: "hidden",
      width: "100%",
    },
    splitSeg: {
      height: "100%",
    },
    splitRows: {
      gap: 9,
      marginTop: 14,
    },
    splitRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    splitLeft: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    splitDot: {
      borderRadius: 5,
      height: 10,
      width: 10,
    },
    splitLabel: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "800",
    },
    splitValue: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900",
    },
    splitShare: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
    },
    earlyCard: {
      backgroundColor: colors.card,
      borderColor: colors.blue,
      borderRadius: 20,
      borderWidth: 1.5,
      padding: 16,
    },
    earlyHead: {
      alignItems: "center",
      flexDirection: "row",
      gap: 9,
    },
    earlyTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900",
    },
    earlyPill: {
      backgroundColor: colors.blue,
      borderRadius: 999,
      color: "#fff",
      fontSize: 10,
      fontWeight: "900",
      overflow: "hidden",
      paddingHorizontal: 9,
      paddingVertical: 3,
      textTransform: "uppercase",
    },
    earlyCopy: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
      marginBottom: 14,
      marginTop: 6,
    },
    earlyTileEmphasis: {
      borderColor: colors.blue,
    },
    earlyFinePrint: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
      marginTop: 14,
    },
    disabledCta: {
      alignItems: "center",
      backgroundColor: colors.blue,
      borderRadius: 14,
      marginTop: 12,
      opacity: 0.5,
      paddingVertical: 13,
    },
    disabledCtaText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "900",
    },
    footer: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
      paddingHorizontal: 8,
      textAlign: "center",
    },
    inkText: {
      color: colors.ink,
    },
    greenText: {
      color: colors.green,
    },
    amberText: {
      color: colors.amber,
    },
    redText: {
      color: colors.red,
    },
  });
