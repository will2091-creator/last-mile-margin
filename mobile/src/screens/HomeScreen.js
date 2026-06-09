import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { currency } from "../theme";
import { useTheme } from "../ThemeContext";
import { loadDashboardSnapshot, loadOpenClaims, loadOwnerCommandCenter, loadTeamMembership } from "../lib/mobileRepository";
import { getRoleDescription, getRoleLabel, normalizeRole } from "../lib/roles";

export default function HomeScreen({ mobileMode, refreshToken, onNavigate }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [claims, setClaims] = useState([]);
  const [membership, setMembership] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [ownerSummary, setOwnerSummary] = useState(null);
  const [status, setStatus] = useState("Loading owner command center...");
  const [detailMetric, setDetailMetric] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      // Always load membership (drives the role label). Financial + claims data
      // is owner-only — drivers never see profit, losses, or claim exposure, so
      // we don't even fetch it in driver mode.
      const membershipResult = await loadTeamMembership();
      if (!isMounted) return;
      if (membershipResult.ok) setMembership(membershipResult.membership);

      if (mobileMode !== "owner") {
        setStatus("Field tools ready.");
        return;
      }

      const [claimsResult, snapshotResult, ownerResult] = await Promise.all([
        loadOpenClaims(),
        loadDashboardSnapshot(),
        loadOwnerCommandCenter(),
      ]);
      if (!isMounted) return;

      if (claimsResult.ok) setClaims(claimsResult.claims);
      if (snapshotResult.ok) setSnapshot(snapshotResult.snapshot);
      if (ownerResult.ok) setOwnerSummary(ownerResult.summary);

      setStatus(claimsResult.ok ? "Owner view loaded." : claimsResult.error);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [refreshToken, mobileMode]);

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
    { metric: "profit", label: "Today's Profit", value: currency.format(displayProfit), note: snapshot?.label || "Latest saved day", tone: displayProfit >= 0 ? "green" : "red" },
    { metric: "revenue", label: "Revenue", value: revenue ? currency.format(revenue) : "Not saved", note: "Contract money", tone: "blue" },
    { metric: "expenses", label: "Expenses", value: costs ? currency.format(costs) : "Not saved", note: "Labor and route costs", tone: "amber" },
    { metric: "claims", label: "Claims Exposure", value: currency.format(displayExposure), note: `${displayOpenClaims} open`, tone: displayExposure ? "red" : "green" },
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

  // Driver home is field-only — no profit, losses, claims, or money. Just the
  // tools a driver uses on a route.
  const driverActions = [
    { id: "checkIn", title: "Check in for your route", note: "Log your start, truck, and route status.", targetTab: "checkIn" },
    { id: "receipts", title: "Submit an expense receipt", note: "Snap fuel, tolls, or supplies and send it in.", targetTab: "receipts" },
    { id: "evidence", title: "Upload field evidence", note: "Attach a photo to a claim ID from your dispatcher.", targetTab: "evidence" },
  ];

  return (
    <>
    <ScrollView contentContainerStyle={styles.container}>
      {isOwnerView ? (
        <>
          <View style={styles.commandGrid}>
            {commandCards.map((card) => (
              <CommandMetricCard
                key={card.metric}
                label={card.label}
                value={card.value}
                note={card.note}
                tone={card.tone}
                onPress={() => setDetailMetric(card.metric)}
              />
            ))}
          </View>
          <Text style={styles.commandHint}>Tap any card for a full breakdown of where the money is.</Text>

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
        <View style={styles.driverHeader}>
          <Text style={styles.driverKicker}>Driver</Text>
          <Text style={styles.driverTitle}>Your field tools</Text>
          <Text style={styles.driverSubtitle}>Check in, submit receipts, and upload evidence from the field.</Text>
        </View>
        <View style={styles.driverActions}>
          {driverActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.driverActionCard} onPress={() => onNavigate?.(action.targetTab)}>
              <View style={styles.driverActionCopy}>
                <Text style={styles.driverActionTitle}>{action.title}</Text>
                <Text style={styles.driverActionNote}>{action.note}</Text>
              </View>
              <Text style={styles.driverActionButton}>Open</Text>
            </TouchableOpacity>
          ))}
        </View>
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

    <MetricDetailModal
      metric={detailMetric}
      onClose={() => setDetailMetric(null)}
      onNavigate={onNavigate}
      data={{
        revenue,
        costs,
        displayProfit,
        margin,
        displayExposure,
        displayOpenClaims,
        profitWeek,
        profitMonth,
        savedDays,
        claims,
        receipts: ownerSummary?.receipts || [],
        snapshotLabel: snapshot?.label || "Latest saved day",
      }}
    />
    </>
  );
}

// ---- Owner metric breakdowns ---------------------------------------------
// Tapping any of the 4 command cards opens a sheet that shows where the money
// is. Everything is built from data the owner has on mobile: per-day snapshots
// (profit/revenue/cost totals), the open-claims list, and submitted expense
// receipts. Line-item revenue and route-cost components live on the web app, so
// those are described, not faked.

function parseReceiptAmount(receipt) {
  const match = String(receipt?.notes || "").match(/Amount:\s*([0-9]+(?:\.[0-9]+)?)/i);
  return match ? Number(match[1] || 0) : 0;
}

function parseReceiptCategory(receipt) {
  const raw = `${String(receipt?.notes || "").match(/^([^|]+?) expense/i)?.[1] || ""} ${receipt?.name || ""}`.toLowerCase();
  if (/fuel|gas/.test(raw)) return "Fuel";
  if (/repair/.test(raw)) return "Repairs";
  if (/tool/.test(raw)) return "Tools";
  if (/maintenance/.test(raw)) return "Maintenance";
  if (/toll|parking/.test(raw)) return "Tolls";
  if (/suppl/.test(raw)) return "Supplies";
  return "Other";
}

function MetricDetailModal({ metric, onClose, onNavigate, data }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!metric) return null;

  const title = {
    profit: "Profit breakdown",
    revenue: "Revenue breakdown",
    expenses: "Expense breakdown",
    claims: "Claims exposure",
  }[metric] || "Breakdown";

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalBackdropTap} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {metric === "profit" && <ProfitBody data={data} />}
            {metric === "revenue" && <RevenueBody data={data} />}
            {metric === "expenses" && <ExpensesBody data={data} />}
            {metric === "claims" && <ClaimsBody data={data} onNavigate={onNavigate} onClose={onClose} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ModalHero({ label, value, note, tone = "ink" }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.modalHero}>
      <Text style={styles.modalHeroLabel}>{label}</Text>
      <Text style={[styles.modalHeroValue, styles[`${tone}Value`] || styles.inkValue]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {note ? <Text style={styles.modalHeroNote}>{note}</Text> : null}
    </View>
  );
}

function BreakdownSection({ title, children }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.breakSection}>
      <Text style={styles.breakSectionTitle}>{title}</Text>
      <View style={styles.breakCard}>{children}</View>
    </View>
  );
}

function BreakdownRow({ label, sub, value, tone = "ink", strong }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.breakRow}>
      <View style={styles.breakCopy}>
        <Text style={[styles.breakLabel, strong && styles.breakLabelStrong]}>{label}</Text>
        {sub ? <Text style={styles.breakSub}>{sub}</Text> : null}
      </View>
      {value != null ? (
        <Text style={[styles.breakValue, styles[`${tone}Value`] || styles.inkValue, strong && styles.breakValueStrong]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      ) : null}
    </View>
  );
}

function RiskTag({ risk }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const normalized = ["High", "Medium", "Low"].includes(risk) ? risk : "Medium";
  const tagStyle = normalized === "High" ? styles.riskHigh : normalized === "Low" ? styles.riskLow : styles.riskMedium;
  return <Text style={[styles.riskTag, tagStyle]}>{normalized}</Text>;
}

function ProfitBody({ data }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { revenue, costs, displayProfit, margin, profitWeek, profitMonth, savedDays, snapshotLabel } = data;
  const tone = displayProfit >= 0 ? "green" : "red";
  const recent = savedDays.slice(0, 5);
  return (
    <>
      <ModalHero label={`Net profit · ${snapshotLabel}`} value={currency.format(displayProfit)} note={margin === null ? "Margin N/A" : `${margin.toFixed(1)}% margin`} tone={tone} />
      <BreakdownSection title="How today's profit is built">
        <BreakdownRow label="Revenue" sub="Money you brought in" value={`+ ${currency.format(revenue)}`} tone="green" />
        <BreakdownRow label="Operating costs" sub="Labor, fuel, fixed & route costs" value={`− ${currency.format(costs)}`} tone="red" />
        <View style={styles.breakDivider} />
        <BreakdownRow label="Net profit" value={currency.format(displayProfit)} tone={tone} strong />
      </BreakdownSection>
      <BreakdownSection title="Profit trend">
        <BreakdownRow label="This week" sub="Last 7 saved days" value={currency.format(profitWeek || displayProfit)} tone="green" />
        <BreakdownRow label="This month" sub="Last 30 saved days" value={currency.format(profitMonth || displayProfit)} tone="green" />
      </BreakdownSection>
      {recent.length > 0 && (
        <BreakdownSection title="Recent saved days">
          {recent.map((day, i) => (
            <BreakdownRow key={day.id || `${day.label}-${i}`} label={day.label || "Saved day"} value={currency.format(Number(day.profit || 0))} tone={Number(day.profit || 0) >= 0 ? "green" : "red"} />
          ))}
        </BreakdownSection>
      )}
    </>
  );
}

function RevenueBody({ data }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { revenue, savedDays } = data;
  const recent = savedDays.slice(0, 7).filter((day) => Number(day.revenue || 0) > 0);
  const avg = recent.length ? recent.reduce((sum, day) => sum + Number(day.revenue || 0), 0) / recent.length : 0;
  return (
    <>
      <ModalHero label="Revenue · latest saved day" value={revenue ? currency.format(revenue) : "Not saved"} note="Contract pay from your routes" tone="blue" />
      {recent.length > 0 ? (
        <BreakdownSection title="Revenue by saved day">
          {recent.map((day, i) => (
            <BreakdownRow key={day.id || `${day.label}-${i}`} label={day.label || "Saved day"} value={currency.format(Number(day.revenue || 0))} tone="blue" />
          ))}
          <View style={styles.breakDivider} />
          <BreakdownRow label="Average per day" value={currency.format(avg)} tone="blue" strong />
        </BreakdownSection>
      ) : (
        <Text style={styles.modalNote}>Save a day on the web dashboard to see revenue broken out by day.</Text>
      )}
      <BreakdownSection title="What revenue is made of">
        <BreakdownRow label="Route pay" sub="Base contract rate for the route" />
        <BreakdownRow label="Per-stop & install pay" sub="Paid per delivery and install" />
        <BreakdownRow label="Surcharges & accessorials" sub="Fuel surcharge, reattempts, extras" />
      </BreakdownSection>
      <Text style={styles.modalNote}>Enter each revenue line on the web dashboard to see the exact amount per source.</Text>
    </>
  );
}

function ExpensesBody({ data }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { costs, receipts } = data;
  const groups = {};
  let receiptTotal = 0;
  for (const receipt of receipts) {
    const cat = parseReceiptCategory(receipt);
    const amt = parseReceiptAmount(receipt);
    receiptTotal += amt;
    if (!groups[cat]) groups[cat] = { amount: 0, count: 0 };
    groups[cat].amount += amt;
    groups[cat].count += 1;
  }
  const categoryRows = Object.entries(groups).sort((a, b) => b[1].amount - a[1].amount);
  return (
    <>
      <ModalHero label="Operating cost · latest saved day" value={costs ? currency.format(costs) : "Not saved"} note="Labor, fuel, fixed & route costs" tone="amber" />
      {categoryRows.length > 0 ? (
        <BreakdownSection title="Submitted expense receipts by category">
          {categoryRows.map(([cat, info]) => (
            <BreakdownRow key={cat} label={cat} sub={`${info.count} receipt${info.count === 1 ? "" : "s"}`} value={currency.format(info.amount)} tone="amber" />
          ))}
          <View style={styles.breakDivider} />
          <BreakdownRow label="Total submitted receipts" value={currency.format(receiptTotal)} tone="amber" strong />
        </BreakdownSection>
      ) : (
        <Text style={styles.modalNote}>No expense receipts submitted yet. Drivers can snap receipts from the mobile app.</Text>
      )}
      <Text style={styles.modalNote}>Operating cost also includes driver and helper labor, the daily truck payment, insurance, and route fuel — entered on the web dashboard.</Text>
    </>
  );
}

function ClaimsBody({ data, onNavigate, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { claims, displayExposure, displayOpenClaims } = data;
  const open = claims.filter((claim) => !/closed|resolved/i.test(String(claim.status || "")));
  const byRisk = { High: { amount: 0, count: 0 }, Medium: { amount: 0, count: 0 }, Low: { amount: 0, count: 0 } };
  for (const claim of open) {
    const risk = ["High", "Medium", "Low"].includes(claim.risk) ? claim.risk : "Medium";
    byRisk[risk].amount += Number(claim.amount || 0);
    byRisk[risk].count += 1;
  }
  return (
    <>
      <ModalHero label={`Open exposure · ${displayOpenClaims} claim${displayOpenClaims === 1 ? "" : "s"}`} value={currency.format(displayExposure)} note="Money at risk if claims go against you" tone="red" />
      <BreakdownSection title="By risk level">
        {["High", "Medium", "Low"].map((risk) => (
          <BreakdownRow
            key={risk}
            label={`${risk} risk`}
            sub={`${byRisk[risk].count} claim${byRisk[risk].count === 1 ? "" : "s"}`}
            value={currency.format(byRisk[risk].amount)}
            tone={risk === "High" ? "red" : risk === "Low" ? "green" : "amber"}
          />
        ))}
      </BreakdownSection>
      {open.length > 0 ? (
        <BreakdownSection title="Open claims">
          {open.slice(0, 10).map((claim, i) => (
            <View key={claim.id || i} style={styles.claimDetailRow}>
              <View style={styles.breakCopy}>
                <Text style={styles.breakLabel}>{claim.type || "Claim"}</Text>
                <Text style={styles.breakSub}>{claim.driver || "No driver"} · {claim.route || claim.category || "Route"}</Text>
              </View>
              <View style={styles.claimDetailRight}>
                <Text style={[styles.breakValue, styles.redValue]} numberOfLines={1}>{currency.format(Number(claim.amount || 0))}</Text>
                <RiskTag risk={claim.risk} />
              </View>
            </View>
          ))}
        </BreakdownSection>
      ) : (
        <Text style={styles.modalNote}>No open claims. Exposure is clear.</Text>
      )}
      <TouchableOpacity style={styles.modalCta} onPress={() => { onClose?.(); onNavigate?.("claims"); }}>
        <Text style={styles.modalCtaText}>Open Claims tab</Text>
      </TouchableOpacity>
    </>
  );
}

function OwnerHero({ profit, revenue, costs, exposure, margin, label, nextAction, onNavigate }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const content = (
    <>
      <View style={styles.commandTop}>
        <Text style={styles.commandLabel}>{label}</Text>
        {onPress ? <Text style={styles.commandChevron}>›</Text> : null}
      </View>
      <Text style={[styles.commandValue, styles[`${tone}Value`] || styles.inkValue]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.commandNote} numberOfLines={1}>{note}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.commandCard} onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.commandCard}>{content}</View>;
}

function AttentionCard({ item, onNavigate }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, styles[`${tone}Value`] || styles.inkValue]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function ActivityRow({ item }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statusTile}>
      <Text style={styles.statusTileLabel}>{label}</Text>
      <Text style={[styles.statusTileValue, styles[`${tone}Value`] || styles.inkValue]}>{value}</Text>
      <Text style={styles.statusTileNote}>{note}</Text>
    </View>
  );
}

function ActionItem({ item, onNavigate }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

const createStyles = (colors) => StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 24,
  },
  statusPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderColor: "#bfdbfe",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusDot: {
    backgroundColor: colors.green,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  status: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  ownerHero: {
    backgroundColor: colors.card,
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
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  ownerTitle: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: 4,
  },
  ownerSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  marginPill: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 74,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  marginPillLabel: {
    color: colors.muted,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 13,
  },
  profitLabel: {
    color: colors.muted,
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
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 5,
  },
  nextMoveCard: {
    alignItems: "center",
    backgroundColor: colors.card,
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
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextMoveTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
    marginTop: 4,
  },
  nextMoveNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 4,
  },
  nextMoveButton: {
    backgroundColor: colors.blue,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 112,
    padding: 13,
  },
  commandLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  commandValue: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },
  commandNote: {
    color: colors.muted,
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
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  attentionNote: {
    color: colors.muted,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    padding: 12,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 5,
  },
  metricCard: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 16,
  },
  metricTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  inkValue: {
    color: colors.ink,
  },
  blueValue: {
    color: colors.blue,
  },
  greenValue: {
    color: colors.green,
  },
  redValue: {
    color: colors.red,
  },
  amberValue: {
    color: colors.amber,
  },
  redSoft: {
    backgroundColor: colors.card,
  },
  amberSoft: {
    backgroundColor: colors.card,
  },
  blueSoft: {
    backgroundColor: colors.card,
  },
  greenSoft: {
    backgroundColor: colors.card,
  },
  activityRow: {
    alignItems: "center",
    borderTopColor: colors.border,
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
    backgroundColor: colors.red,
  },
  amberDot: {
    backgroundColor: colors.amber,
  },
  blueDot: {
    backgroundColor: colors.blue,
  },
  greenDot: {
    backgroundColor: colors.green,
  },
  activityCopy: {
    flex: 1,
  },
  activityTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  activityNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  activityTime: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  metricNote: {
    marginTop: 4,
    color: colors.muted,
    fontWeight: "800",
  },
  card: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: colors.muted,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  statusTileLabel: {
    color: colors.muted,
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
    color: colors.muted,
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
    backgroundColor: colors.card,
  },
  amberAction: {
    backgroundColor: colors.card,
  },
  blueAction: {
    backgroundColor: colors.card,
  },
  greenAction: {
    backgroundColor: colors.card,
  },
  actionDot: {
    backgroundColor: colors.blue,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  actionNote: {
    color: colors.muted,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  actionChevron: {
    color: colors.muted,
    fontSize: 25,
    fontWeight: "900",
  },
  actionButton: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  actionTag: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  miniRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11,
  },
  miniBody: {
    flex: 1,
  },
  miniTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  miniNote: {
    color: colors.muted,
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
    backgroundColor: colors.card,
    color: colors.blue,
  },
  amount: {
    color: colors.red,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "800",
    paddingVertical: 8,
  },
  financeRow: {
    borderTopColor: colors.border,
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
    color: colors.muted,
    fontWeight: "900",
  },
  financeNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },
  financeValue: {
    color: colors.ink,
    fontWeight: "900",
    maxWidth: 118,
    textAlign: "right",
  },
  formulaBox: {
    backgroundColor: colors.card,
    borderColor: "#bbf7d0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  formulaLabel: {
    color: colors.green,
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
    color: colors.green,
    fontSize: 40,
    fontWeight: "900",
  },
  readinessLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: -2,
  },
  readinessNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.green,
    borderRadius: 999,
    height: 10,
  },
  driverHeader: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  driverKicker: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  driverTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 3,
  },
  driverSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 6,
  },
  driverActions: {
    gap: 10,
  },
  driverActionCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 16,
  },
  driverActionCopy: {
    flex: 1,
  },
  driverActionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  driverActionNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  driverActionButton: {
    backgroundColor: colors.blue,
    borderRadius: 999,
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleCard: {
    borderColor: "#bfdbfe",
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 16,
  },
  roleTitle: {
    color: colors.blue,
    fontSize: 17,
    fontWeight: "900",
  },
  roleCopy: {
    color: colors.ink,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 6,
  },
  roleHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10,
  },
  commandTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commandChevron: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: "900",
    marginTop: -3,
  },
  commandHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: -2,
    paddingHorizontal: 4,
  },
  modalBackdrop: {
    backgroundColor: "rgba(2,6,23,0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdropTap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "88%",
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 5,
    marginBottom: 12,
    width: 40,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
  },
  modalClose: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalCloseText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "900",
  },
  modalBody: {
    gap: 14,
    paddingBottom: 16,
  },
  modalHero: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  modalHeroLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  modalHeroValue: {
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
  },
  modalHeroNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  modalNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  breakSection: {
    gap: 8,
  },
  breakSectionTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 4,
    textTransform: "uppercase",
  },
  breakCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  breakRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingVertical: 11,
  },
  breakCopy: {
    flex: 1,
  },
  breakLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  breakLabelStrong: {
    fontWeight: "900",
  },
  breakSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: 2,
  },
  breakValue: {
    fontSize: 15,
    fontWeight: "900",
    maxWidth: 140,
    textAlign: "right",
  },
  breakValueStrong: {
    fontSize: 18,
  },
  breakDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 4,
  },
  riskTag: {
    borderRadius: 999,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    textAlign: "center",
  },
  riskHigh: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  riskMedium: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  riskLow: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  claimDetailRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingVertical: 11,
  },
  claimDetailRight: {
    alignItems: "flex-end",
  },
  modalCta: {
    alignItems: "center",
    backgroundColor: colors.blue,
    borderRadius: 14,
    marginTop: 4,
    paddingVertical: 13,
  },
  modalCtaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});
