import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { currency, theme } from "../theme";
import { loadDashboardSnapshot, loadOpenClaims, loadOwnerCommandCenter, loadTeamMembership } from "../lib/mobileRepository";
import { getRoleDescription, getRoleLabel, normalizeRole } from "../lib/roles";

export default function HomeScreen({ mobileMode, refreshToken, onNavigate }) {
  const [claims, setClaims] = useState([]);
  const [membership, setMembership] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [ownerSummary, setOwnerSummary] = useState(null);
  const [status, setStatus] = useState("Loading owner command center...");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [claimsResult, membershipResult, snapshotResult, ownerResult] = await Promise.all([
        loadOpenClaims(),
        loadTeamMembership(),
        loadDashboardSnapshot(),
        loadOwnerCommandCenter(),
      ]);
      if (!isMounted) return;

      if (claimsResult.ok) setClaims(claimsResult.claims);
      if (membershipResult.ok) setMembership(membershipResult.membership);
      if (snapshotResult.ok) setSnapshot(snapshotResult.snapshot);
      if (ownerResult.ok) setOwnerSummary(ownerResult.summary);

      setStatus(claimsResult.ok ? "Owner view loaded." : claimsResult.error);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const totalExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const displayExposure = snapshot?.claimsExposure ?? totalExposure;
  const displayOpenClaims = snapshot?.openClaims ?? claims.length;
  const displayProfit = snapshot?.profit ?? 356.03;
  const revenue = snapshot?.revenue ?? 0;
  const costs = snapshot?.costs ?? 0;
  const margin = revenue ? (displayProfit / revenue) * 100 : null;
  const highRiskClaims = claims.filter((claim) => claim.risk === "High");
  const preventableClaims = claims.filter((claim) => String(claim.preventable || "").toLowerCase() === "yes");
  const role = normalizeRole(membership?.role);
  const roleLabel = getRoleLabel(role);
  const roleDescription = getRoleDescription(role);
  const isOwnerView = mobileMode === "owner" && (role === "owner" || role === "admin");
  const teamTotal = ownerSummary?.teamMembers?.length || 0;
  const checkedInCount = ownerSummary?.checkedInCount || 0;
  const notCheckedInCount = ownerSummary?.notCheckedInCount || 0;
  const readinessScore = teamTotal ? Math.round((checkedInCount / teamTotal) * 100) : 0;
  const pendingReceiptCount = ownerSummary?.pendingReceipts?.length || 0;
  const missingDocCount = ownerSummary?.missingDocs?.length || 0;
  const savedDays = ownerSummary?.savedDays || [];
  const profitWeek = savedDays.slice(0, 7).reduce((sum, day) => sum + Number(day.profit || 0), 0);
  const profitMonth = savedDays.slice(0, 30).reduce((sum, day) => sum + Number(day.profit || 0), 0);
  const claimsThisMonth = claims.filter((claim) => isCurrentMonth(claim.date)).length;
  const fuelSpend = (ownerSummary?.receipts || []).reduce((sum, receipt) => {
    const label = `${receipt.name || ""} ${receipt.notes || ""}`;
    if (!/fuel|gas/i.test(label)) return sum;
    return sum + extractMoneyFromText(label);
  }, 0);

  const actionInbox = useMemo(
    () => buildActionInbox({
      claims,
      highRiskClaims,
      ownerSummary,
      displayProfit,
      displayExposure,
    }),
    [claims, displayExposure, displayProfit, highRiskClaims, ownerSummary]
  );

  const commandCards = [
    ["Today's Profit", currency.format(displayProfit), snapshot?.label || "Latest saved day", displayProfit >= 0 ? "green" : "red", null],
    ["Revenue", revenue ? currency.format(revenue) : "Not saved", "Contract money", "blue", null],
    ["Expenses", costs ? currency.format(costs) : "Not saved", "Labor and route costs", "amber", null],
    ["Claims Exposure", currency.format(displayExposure), `${displayOpenClaims} open`, displayExposure ? "red" : "green", "claims"],
  ];
  const attentionItems = [
    {
      id: "claims",
      title: `${highRiskClaims.length || displayOpenClaims} Claim${(highRiskClaims.length || displayOpenClaims) === 1 ? "" : "s"} Need Review`,
      value: currency.format(displayExposure),
      note: "Money at risk",
      tone: displayOpenClaims ? "red" : "green",
      targetTab: "claims",
      show: Boolean(displayOpenClaims),
    },
    {
      id: "receipts",
      title: `${pendingReceiptCount} Receipt${pendingReceiptCount === 1 ? "" : "s"} Await Approval`,
      value: pendingReceiptCount,
      note: "Expense decisions",
      tone: pendingReceiptCount ? "amber" : "green",
      targetTab: "receipts",
      show: Boolean(pendingReceiptCount),
    },
    {
      id: "compliance",
      title: `${missingDocCount} Compliance Document${missingDocCount === 1 ? "" : "s"} Expiring`,
      value: missingDocCount,
      note: "Operational risk",
      tone: missingDocCount ? "red" : "green",
      targetTab: "more",
      show: Boolean(missingDocCount),
    },
    {
      id: "team",
      title: `${notCheckedInCount} Team Member${notCheckedInCount === 1 ? "" : "s"} Needs Attention`,
      value: `${readinessScore}%`,
      note: "Route readiness",
      tone: notCheckedInCount ? "amber" : "green",
      targetTab: "team",
      show: Boolean(notCheckedInCount),
    },
  ].filter((item) => item.show);
  const quickMetrics = [
    ["Profit Today", currency.format(displayProfit), displayProfit >= 0 ? "green" : "red"],
    ["Profit This Week", currency.format(profitWeek || displayProfit), "green"],
    ["Profit This Month", currency.format(profitMonth || displayProfit), "green"],
    ["Claims This Month", claimsThisMonth, claimsThisMonth ? "red" : "green"],
    ["Open Claims", displayOpenClaims, displayOpenClaims ? "red" : "green"],
    ["Fuel Spend", fuelSpend ? currency.format(fuelSpend) : "Not saved", "amber"],
  ];
  const recentActivity = buildRecentActivity({ claims, ownerSummary });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isOwnerView ? (
        <>
          <View style={styles.commandGrid}>
            {commandCards.map(([label, value, note, tone, targetTab]) => (
              <CommandMetricCard
                key={label}
                label={label}
                value={value}
                note={note}
                tone={tone}
                onPress={targetTab ? () => onNavigate?.(targetTab) : null}
              />
            ))}
          </View>

          <Section title="Needs Attention" subtitle="Tap a card to go straight to the decision">
            {(attentionItems.length ? attentionItems : [{
              id: "clear",
              title: "No urgent owner actions",
              value: "Clear",
              note: "Claims, receipts, team, and compliance look steady.",
              tone: "green",
            }]).map((item) => (
              <AttentionCard key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </Section>

          <Section title="Quick Metrics" subtitle="Money and risk without digging">
            <View style={styles.quickGrid}>
              {quickMetrics.map(([label, value, tone]) => (
                <SummaryTile key={label} label={label} value={value} tone={tone} />
              ))}
            </View>
          </Section>

          <Section title="Recent Activity" subtitle="Latest business movement">
            {recentActivity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </Section>
        </>
      ) : (
        <>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.status}>{status}</Text>
        </View>
        <View style={styles.heroGrid}>
          <MetricCard title="Profit" value={currency.format(displayProfit)} note={snapshot?.label || "Current route snapshot"} tone={displayProfit >= 0 ? "green" : "red"} />
          <MetricCard title="Claims" value={displayOpenClaims} note={`${currency.format(displayExposure)} open exposure`} tone="blue" />
          <MetricCard title="Losses" value={currency.format(displayExposure)} note={`${highRiskClaims.length} high-risk claim${highRiskClaims.length === 1 ? "" : "s"}`} tone="red" />
        </View>
        <Section title="Today’s field focus" subtitle="Items assigned to your daily workflow">
          {claims.slice(0, 3).map((claim) => (
            <ClaimRow key={claim.id} claim={claim} />
          ))}
          {!claims.length && <ActivityIndicator color={theme.colors.blue} />}
        </Section>
        </>
      )}

      {!isOwnerView && (
        <View style={styles.roleCard}>
          <Text style={styles.roleTitle}>{roleLabel} mobile access</Text>
          <Text style={styles.roleCopy}>{roleDescription}</Text>
          {membership?.isFallbackOwner && (
            <Text style={styles.roleHint}>Owner fallback is active because this login owns the workspace but does not have a linked team membership row yet.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function OwnerHero({ profit, revenue, costs, exposure, margin, label, nextAction, onNavigate }) {
  const canNavigate = Boolean(nextAction?.targetTab);
  const profitTone = profit >= 0 ? styles.greenValue : styles.redValue;
  const ownerMove = nextAction?.title || "Review today’s saved routes";
  const ownerNote = nextAction?.note || "Open the highest-priority section and make the next decision.";

  return (
    <View style={styles.ownerHero}>
      <View style={styles.ownerHeroTop}>
        <View style={styles.ownerHeroCopy}>
          <Text style={styles.ownerKicker}>Owner command center</Text>
          <Text style={styles.ownerTitle}>Today</Text>
          <Text style={styles.ownerSubtitle}>{label} · Profit, risk, readiness</Text>
        </View>
        <View style={styles.marginPill}>
          <Text style={styles.marginPillLabel}>Margin</Text>
          <Text style={[styles.marginPillValue, profitTone]}>{margin === null ? "N/A" : `${margin.toFixed(1)}%`}</Text>
        </View>
      </View>

      <View style={styles.profitPanel}>
        <Text style={styles.profitLabel}>Net profit</Text>
        <Text style={[styles.profitValue, profitTone]}>{currency.format(profit)}</Text>
        <Text style={styles.profitFormula}>
          Rev {revenue ? currency.format(revenue) : "not saved"} · Costs {costs ? currency.format(costs) : "not saved"} · Claims {currency.format(exposure)}
        </Text>
      </View>

      <TouchableOpacity
        disabled={!canNavigate}
        onPress={() => nextAction?.targetTab && onNavigate?.(nextAction.targetTab)}
        style={[styles.nextMoveCard, !canNavigate && styles.staticActionItem]}
      >
        <View style={styles.nextMoveCopy}>
          <Text style={styles.nextMoveLabel}>Next owner move</Text>
          <Text style={styles.nextMoveTitle}>{ownerMove}</Text>
          <Text style={styles.nextMoveNote}>{ownerNote}</Text>
        </View>
        <Text style={styles.nextMoveButton}>{nextAction?.actionLabel || "Review"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function CommandMetricCard({ label, value, note, tone, onPress }) {
  const content = (
    <>
      <Text style={styles.commandLabel}>{label}</Text>
      <Text style={[styles.commandValue, styles[`${tone}Value`] || styles.inkValue]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.commandNote} numberOfLines={1}>{note}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.commandCard} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.commandCard}>{content}</View>;
}

function AttentionCard({ item, onNavigate }) {
  const isActionable = Boolean(item.targetTab);
  return (
    <TouchableOpacity
      disabled={!isActionable}
      onPress={() => item.targetTab && onNavigate?.(item.targetTab)}
      style={[styles.attentionCard, styles[`${item.tone}Soft`] || styles.blueSoft, !isActionable && styles.staticActionItem]}
    >
      <View style={styles.attentionCopy}>
        <Text style={styles.attentionTitle}>{item.title}</Text>
        <Text style={styles.attentionNote}>{item.note}</Text>
      </View>
      <Text style={[styles.attentionValue, styles[`${item.tone}Value`] || styles.inkValue]}>{item.value}</Text>
    </TouchableOpacity>
  );
}

function SummaryTile({ label, value, tone }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, styles[`${tone}Value`] || styles.inkValue]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function ActivityRow({ item }) {
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityDot, styles[`${item.tone}Dot`] || styles.blueDot]} />
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityNote}>{item.note}</Text>
      </View>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
  );
}

function MetricCard({ title, value, note, tone = "ink" }) {
  const toneStyle = styles[`${tone}Value`] || styles.inkValue;

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, toneStyle]}>{value}</Text>
      <Text style={styles.metricNote}>{note}</Text>
    </View>
  );
}

function StatusTile({ label, value, note, tone }) {
  return (
    <View style={styles.statusTile}>
      <Text style={styles.statusTileLabel}>{label}</Text>
      <Text style={[styles.statusTileValue, styles[`${tone}Value`] || styles.inkValue]}>{value}</Text>
      <Text style={styles.statusTileNote}>{note}</Text>
    </View>
  );
}

function ActionItem({ item, onNavigate }) {
  const isActionable = Boolean(item.targetTab);
  const label = item.actionLabel || (isActionable ? "Open" : "Info");

  return (
    <TouchableOpacity
      disabled={!isActionable}
      onPress={() => {
        if (item.targetTab) onNavigate?.(item.targetTab);
      }}
      style={[styles.actionItem, styles[`${item.tone}Action`] || styles.blueAction, !isActionable && styles.staticActionItem]}
    >
      <View style={styles.actionDot} />
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        <Text style={styles.actionNote}>{item.note}</Text>
      </View>
      <Text style={isActionable ? styles.actionButton : styles.actionTag}>{label}</Text>
    </TouchableOpacity>
  );
}

function MiniList({ items, emptyText }) {
  if (!items.length) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return items.slice(0, 4).map((item) => (
    <View key={item.id} style={styles.miniRow}>
      <View style={styles.miniBody}>
        <Text style={styles.miniTitle}>{item.title}</Text>
        <Text style={styles.miniNote}>{item.note}</Text>
      </View>
      <Text style={[styles.miniBadge, styles[`${item.tone}Badge`] || styles.blueBadge]}>{item.badge}</Text>
    </View>
  ));
}

function ClaimRow({ claim }) {
  return (
    <View style={styles.miniRow}>
      <View style={styles.miniBody}>
        <Text style={styles.miniTitle}>{claim.id} · {claim.type}</Text>
        <Text style={styles.miniNote}>{claim.team || "Unassigned"} · {claim.driver || "No driver"}</Text>
      </View>
      <Text style={styles.amount}>{currency.format(Number(claim.amount || 0))}</Text>
    </View>
  );
}

function buildActionInbox({ claims, highRiskClaims, ownerSummary, displayProfit, displayExposure }) {
  const items = [];
  const missingEvidence = claims.filter((claim) => /missing|photo|evidence/i.test(`${claim.status || ""} ${claim.type || ""}`));

  if (highRiskClaims.length) {
    items.push({
      id: "high-risk-claims",
      title: `${highRiskClaims.length} high-risk claim${highRiskClaims.length === 1 ? "" : "s"} need review`,
      note: `${currency.format(displayExposure)} exposure is still open.`,
      tone: "red",
      targetTab: "claims",
      actionLabel: "Review claims",
    });
  }

  if (ownerSummary?.pendingReceipts?.length) {
    items.push({
      id: "receipt-approvals",
      title: `${ownerSummary.pendingReceipts.length} receipt${ownerSummary.pendingReceipts.length === 1 ? "" : "s"} need approval`,
      note: "Review fuel, tools, maintenance, and toll spend.",
      tone: "amber",
      targetTab: "receipts",
      actionLabel: "Open receipts",
    });
  }

  if (ownerSummary?.notCheckedInCount) {
    items.push({
      id: "missing-checkins",
      title: `${ownerSummary.notCheckedInCount} team member${ownerSummary.notCheckedInCount === 1 ? "" : "s"} not checked in`,
      note: "Confirm route readiness before dispatch.",
      tone: "amber",
      actionLabel: "Follow up",
    });
  }

  if (displayProfit < 0) {
    items.push({
      id: "negative-profit",
      title: "Profit is negative today",
      note: "Check route costs, receipts, and open claim exposure.",
      tone: "red",
      actionLabel: "Fix margin",
    });
  }

  if (missingEvidence.length) {
    items.push({
      id: "missing-evidence",
      title: `${missingEvidence.length} claim${missingEvidence.length === 1 ? "" : "s"} may need evidence`,
      note: "Photos and notes help protect disputes.",
      tone: "blue",
      targetTab: "claims",
      actionLabel: "Add evidence",
    });
  }

  if (!items.length) {
    items.push({
      id: "clear",
      title: "No urgent owner actions",
      note: "Profit, claims, team check-ins, and approvals look clear.",
      tone: "green",
      actionLabel: "Clear",
    });
  }

  return items.slice(0, 5);
}

function buildTeamList(ownerSummary) {
  const checkIns = ownerSummary?.checkIns || [];
  const members = ownerSummary?.teamMembers || [];
  const checkedInUserIds = new Set(checkIns.map((item) => item.user_id).filter(Boolean));

  const checkedInRows = checkIns.slice(0, 3).map((item) => ({
    id: `checkin-${item.id}`,
    title: item.route_name || "Route check-in",
    note: item.truck ? `Truck ${item.truck}` : "Field check-in received",
    badge: "In",
    tone: "green",
  }));

  const missingRows = members
    .filter((member) => member.user_id && !checkedInUserIds.has(member.user_id))
    .slice(0, 3)
    .map((member) => ({
      id: `missing-${member.id}`,
      title: member.display_name || member.email || "Team member",
      note: member.role ? `${member.role} has not checked in` : "No check-in yet",
      badge: "Open",
      tone: "amber",
    }));

  return [...checkedInRows, ...missingRows];
}

function buildApprovalList({ ownerSummary, highRiskClaims, preventableClaims }) {
  const receipts = (ownerSummary?.pendingReceipts || []).slice(0, 2).map((receipt) => ({
    id: `receipt-${receipt.id}`,
    title: receipt.name || "Expense receipt",
    note: receipt.notes || "Uploaded from mobile",
    badge: "Receipt",
    tone: "amber",
  }));

  const claims = highRiskClaims.slice(0, 2).map((claim) => ({
    id: `claim-${claim.id}`,
    title: claim.type || "Claim review",
    note: `${claim.team || "Unassigned"} · ${currency.format(Number(claim.amount || 0))}`,
    badge: "Claim",
    tone: "red",
  }));

  const preventable = preventableClaims.slice(0, 1).map((claim) => ({
    id: `preventable-${claim.id}`,
    title: "Preventable claim decision",
    note: `${claim.type || "Claim"} may need coaching follow-up.`,
    badge: "Review",
    tone: "blue",
  }));

  return [...receipts, ...claims, ...preventable];
}

function buildRecentActivity({ claims, ownerSummary }) {
  const claimRows = claims.slice(0, 2).map((claim) => ({
    id: `activity-claim-${claim.id}`,
    title: "Claim Submitted",
    note: `${claim.driver || "No driver"} · ${currency.format(Number(claim.amount || 0))}`,
    time: formatShortDate(claim.date),
    tone: claim.risk === "High" ? "red" : "amber",
  }));

  const receiptRows = (ownerSummary?.receipts || []).slice(0, 2).map((receipt) => ({
    id: `activity-receipt-${receipt.id}`,
    title: /approved|reviewed/i.test(String(receipt.status || "")) ? "Receipt Approved" : "Receipt Uploaded",
    note: receipt.name || "Expense receipt",
    time: formatShortDate(receipt.uploaded_at || receipt.created_at),
    tone: /approved|reviewed/i.test(String(receipt.status || "")) ? "green" : "amber",
  }));

  const teamRows = (ownerSummary?.teamMembers || []).slice(0, 1).map((member) => ({
    id: `activity-member-${member.id}`,
    title: "Driver Added",
    note: member.display_name || member.email || "Team member",
    time: "Team",
    tone: "blue",
  }));

  const rows = [...claimRows, ...receiptRows, ...teamRows];
  if (rows.length) return rows.slice(0, 4);

  return [{
    id: "activity-empty",
    title: "No recent activity yet",
    note: "Claims, receipts, team, and contract updates will appear here.",
    time: "Now",
    tone: "green",
  }];
}

function isCurrentMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function extractMoneyFromText(value) {
  const match = String(value || "").match(/Amount:\s*([0-9]+(?:\.[0-9]+)?)/i);
  return match ? Number(match[1] || 0) : 0;
}

function formatShortDate(value) {
  if (!value) return "Recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 24,
  },
  statusPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    borderColor: "#bfdbfe",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusDot: {
    backgroundColor: theme.colors.green,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  status: {
    color: theme.colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  ownerHero: {
    backgroundColor: theme.colors.card,
    borderColor: "#bfdbfe",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  ownerHeroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  ownerHeroCopy: {
    flex: 1,
  },
  ownerKicker: {
    color: theme.colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  ownerTitle: {
    color: theme.colors.ink,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: 4,
  },
  ownerSubtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  marginPill: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: theme.colors.border,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 74,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  marginPillLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  marginPillValue: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },
  profitPanel: {
    backgroundColor: "#f8fafc",
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 13,
  },
  profitLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  profitValue: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  profitFormula: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 5,
  },
  nextMoveCard: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    padding: 12,
  },
  nextMoveCopy: {
    flex: 1,
  },
  nextMoveLabel: {
    color: theme.colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextMoveTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
    marginTop: 4,
  },
  nextMoveNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 4,
  },
  nextMoveButton: {
    backgroundColor: theme.colors.blue,
    borderRadius: 999,
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroGrid: {
    gap: 12,
  },
  commandGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  commandCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 112,
    padding: 13,
  },
  commandLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  commandValue: {
    color: theme.colors.ink,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },
  commandNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  attentionCard: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  attentionCopy: {
    flex: 1,
    minWidth: 0,
  },
  attentionTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  attentionNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  attentionValue: {
    fontSize: 17,
    fontWeight: "900",
    maxWidth: 112,
    textAlign: "right",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryTile: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    padding: 12,
  },
  summaryLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: theme.colors.ink,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 5,
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
  inkValue: {
    color: theme.colors.ink,
  },
  blueValue: {
    color: theme.colors.blue,
  },
  greenValue: {
    color: theme.colors.green,
  },
  redValue: {
    color: theme.colors.red,
  },
  amberValue: {
    color: theme.colors.amber,
  },
  redSoft: {
    backgroundColor: "#fef2f2",
  },
  amberSoft: {
    backgroundColor: "#fffbeb",
  },
  blueSoft: {
    backgroundColor: "#eff6ff",
  },
  greenSoft: {
    backgroundColor: "#ecfdf5",
  },
  activityRow: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11,
  },
  activityDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  redDot: {
    backgroundColor: theme.colors.red,
  },
  amberDot: {
    backgroundColor: theme.colors.amber,
  },
  blueDot: {
    backgroundColor: theme.colors.blue,
  },
  greenDot: {
    backgroundColor: theme.colors.green,
  },
  activityCopy: {
    flex: 1,
  },
  activityTitle: {
    color: theme.colors.ink,
    fontWeight: "900",
  },
  activityNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  activityTime: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  metricNote: {
    marginTop: 4,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: theme.colors.muted,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 3,
  },
  sectionBody: {
    gap: 10,
    marginTop: 12,
  },
  ownerGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statusTile: {
    backgroundColor: "#f8fafc",
    borderColor: theme.colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  statusTileLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statusTileValue: {
    fontSize: 25,
    fontWeight: "900",
    marginTop: 5,
  },
  statusTileNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  actionItem: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  staticActionItem: {
    opacity: 0.92,
  },
  redAction: {
    backgroundColor: "#fef2f2",
  },
  amberAction: {
    backgroundColor: "#fffbeb",
  },
  blueAction: {
    backgroundColor: "#eff6ff",
  },
  greenAction: {
    backgroundColor: "#ecfdf5",
  },
  actionDot: {
    backgroundColor: theme.colors.blue,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  actionNote: {
    color: theme.colors.muted,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  actionChevron: {
    color: theme.colors.muted,
    fontSize: 25,
    fontWeight: "900",
  },
  actionButton: {
    backgroundColor: theme.colors.ink,
    borderRadius: 999,
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  actionTag: {
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  miniRow: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11,
  },
  miniBody: {
    flex: 1,
  },
  miniTitle: {
    color: theme.colors.ink,
    fontWeight: "900",
  },
  miniNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  miniBadge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  greenBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  amberBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  redBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  blueBadge: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  amount: {
    color: theme.colors.red,
    fontWeight: "900",
  },
  emptyText: {
    color: theme.colors.muted,
    fontWeight: "800",
    paddingVertical: 8,
  },
  financeRow: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  financeCopy: {
    flex: 1,
  },
  financeLabel: {
    color: theme.colors.muted,
    fontWeight: "900",
  },
  financeNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },
  financeValue: {
    color: theme.colors.ink,
    fontWeight: "900",
    maxWidth: 118,
    textAlign: "right",
  },
  formulaBox: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  formulaLabel: {
    color: theme.colors.green,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  formulaText: {
    color: "#064e3b",
    fontWeight: "900",
    lineHeight: 20,
    marginTop: 4,
  },
  readinessHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  readinessValue: {
    color: theme.colors.green,
    fontSize: 40,
    fontWeight: "900",
  },
  readinessLabel: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: -2,
  },
  readinessNote: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },
  progressTrack: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: theme.colors.green,
    borderRadius: 999,
    height: 10,
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
});
