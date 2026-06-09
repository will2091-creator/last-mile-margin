import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from "@expo-google-fonts/inter";
import { applyInterFont } from "./src/applyInterFont";

// Map every <Text>'s fontWeight to the matching Inter variant, app-wide, so
// the mobile app shares the web app's Inter typography with crisp weights.
applyInterFont();
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ClaimsScreen from "./src/screens/ClaimsScreen";
import CheckInScreen from "./src/screens/CheckInScreen";
import EvidenceScreen from "./src/screens/EvidenceScreen";
import ReceiptsScreen from "./src/screens/ReceiptsScreen";
import TeamScreen from "./src/screens/TeamScreen";
import MoreScreen from "./src/screens/MoreScreen";
import { supabase } from "./src/lib/supabaseClient";
import { loadTeamMembership } from "./src/lib/mobileRepository";
import { normalizeRole } from "./src/lib/roles";
import { ThemeProvider, useTheme } from "./src/ThemeContext";

const tabs = [
  { key: "home", label: "Home", ownerLabel: "Command", modes: ["owner", "driver"] },
  { key: "claims", label: "Claims", modes: ["owner"] },
  { key: "receipts", label: "Receipts", modes: ["owner", "driver"] },
  { key: "team", label: "Team", modes: ["owner"] },
  { key: "more", label: "More", modes: ["owner"] },
  { key: "checkIn", label: "Check In", modes: ["driver"] },
  { key: "evidence", label: "Evidence", modes: ["driver"] },
];

function AppShell() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
  // Never block the app on fonts — if they fail, fall through to system fonts.
  const fontsReady = fontsLoaded || Boolean(fontError);
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [refreshToken, setRefreshToken] = useState(0);
  const [mobileRole, setMobileRole] = useState(null);
  const [mobileMode, setMobileMode] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session || null);
      setIsLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      if (!nextSession) {
        setMobileRole(null);
        setMobileMode(null);
        setIsLoadingRole(false);
        setActiveTab("home");
      }
      setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      if (!session) {
        setIsLoadingRole(false);
        return;
      }
      setIsLoadingRole(true);
      const result = await loadTeamMembership();
      if (!isMounted) return;
      const nextRole = normalizeRole(result.ok ? result.membership?.role : null);
      setMobileRole(nextRole);
      if (nextRole === "driver") setMobileMode("driver");
      if ((nextRole === "dispatcher" || !nextRole) && !mobileMode) setMobileMode("driver");
      setIsLoadingRole(false);
    }

    loadRole();
    return () => {
      isMounted = false;
    };
  }, [refreshToken, session]);

  const canChooseMode = mobileRole === "owner" || mobileRole === "admin";
  const effectiveMode = isLoadingRole ? null : mobileMode || (canChooseMode ? null : "driver");

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => effectiveMode && tab.modes.includes(effectiveMode)),
    [effectiveMode]
  );

  useEffect(() => {
    if (effectiveMode && !visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab("home");
    }
  }, [activeTab, effectiveMode, visibleTabs]);

  const screenProps = useMemo(
    () => ({
      session,
      mobileMode: effectiveMode,
      refreshToken,
      onDataChange: () => setRefreshToken((current) => current + 1),
      onNavigate: setActiveTab,
    }),
    [effectiveMode, refreshToken, session]
  );

  if (!fontsReady || isLoadingSession || (session && isLoadingRole)) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.blue} />
        <Text style={styles.loadingText}>Loading Final Mile Margin...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (session && !effectiveMode) {
    return <ModeChooser onChoose={setMobileMode} onSignOut={() => supabase.auth.signOut()} />;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Final Mile Margin</Text>
          <Text style={styles.title}>{effectiveMode === "owner" ? "Owner Command" : "Driver App"}</Text>
          <Text style={styles.headerSubtitle}>
            {effectiveMode === "owner" ? "Profit, risk, approvals" : "Check-ins, evidence, receipts"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {canChooseMode && (
            <TouchableOpacity style={styles.modeButton} onPress={() => setMobileMode(null)}>
              <Text style={styles.modeButtonText}>{effectiveMode === "owner" ? "Owner" : "Driver"}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.signOutButton} onPress={toggleTheme}>
            <Text style={styles.signOutText}>{isDark ? "☀" : "☾"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
            <Text style={styles.signOutText}>Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === "home" && <HomeScreen {...screenProps} />}
        {activeTab === "claims" && <ClaimsScreen {...screenProps} />}
        {activeTab === "checkIn" && <CheckInScreen {...screenProps} />}
        {activeTab === "receipts" && <ReceiptsScreen {...screenProps} />}
        {activeTab === "evidence" && <EvidenceScreen {...screenProps} />}
        {activeTab === "team" && <TeamScreen {...screenProps} />}
        {activeTab === "more" && <MoreScreen {...screenProps} />}
      </View>

      <View style={styles.tabBar}>
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const label = effectiveMode === "owner" && tab.ownerLabel ? tab.ownerLabel : tab.label;
          return (
            <TouchableOpacity key={tab.key} style={[styles.tabButton, isActive && styles.activeTabButton]} onPress={() => setActiveTab(tab.key)}>
              <TabIcon tabKey={tab.key} isActive={isActive} />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function TabIcon({ tabKey, isActive }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tint = isActive ? "#fff" : colors.muted;
  const fill = isActive ? "#fff" : colors.blue;
  const lineStyle = { backgroundColor: tint };
  const dotStyle = { backgroundColor: fill };

  if (tabKey === "home") {
    return (
      <View style={styles.navIcon}>
        <View style={[styles.iconBar, styles.iconBarWide, lineStyle]} />
        <View style={[styles.iconBar, lineStyle]} />
        <View style={[styles.iconBar, styles.iconBarShort, lineStyle]} />
      </View>
    );
  }

  if (tabKey === "claims") {
    return (
      <View style={styles.navIcon}>
        <View style={[styles.iconDot, dotStyle]} />
        <View style={[styles.iconBar, styles.iconBarWide, lineStyle]} />
        <View style={[styles.iconBar, styles.iconBarShort, lineStyle]} />
      </View>
    );
  }

  if (tabKey === "receipts") {
    return (
      <View style={[styles.navIcon, styles.receiptIcon]}>
        <View style={[styles.iconBar, styles.iconBarWide, lineStyle]} />
        <View style={[styles.iconBar, styles.iconBarShort, lineStyle]} />
      </View>
    );
  }

  if (tabKey === "team") {
    return (
      <View style={styles.navIconRow}>
        <View style={[styles.personDot, dotStyle]} />
        <View style={[styles.personDot, styles.personDotSmall, dotStyle]} />
      </View>
    );
  }

  if (tabKey === "more") {
    return (
      <View style={styles.navIconRow}>
        <View style={[styles.moreDot, dotStyle]} />
        <View style={[styles.moreDot, dotStyle]} />
        <View style={[styles.moreDot, dotStyle]} />
      </View>
    );
  }

  return (
    <View style={styles.navIcon}>
      <View style={[styles.iconBar, styles.iconBarWide, lineStyle]} />
      <View style={[styles.iconBar, lineStyle]} />
    </View>
  );
}

function ModeChooser({ onChoose, onSignOut }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.modeShell}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.modeCard}>
        <Text style={styles.kicker}>Final Mile Margin</Text>
        <Text style={styles.modeTitle}>How are you working today?</Text>
        <Text style={styles.modeCopy}>Choose the app view for this session. Owner mode keeps control features separate from driver field work.</Text>
        <TouchableOpacity style={styles.primaryModeOption} onPress={() => onChoose("owner")}>
          <Text style={styles.primaryModeTitle}>Owner Mode</Text>
          <Text style={styles.primaryModeCopy}>Profit, claims, approvals, team status, and finance.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryModeOption} onPress={() => onChoose("driver")}>
          <Text style={styles.secondaryModeTitle}>Driver Mode</Text>
          <Text style={styles.secondaryModeCopy}>Check in, receipts, evidence photos, and assigned field tasks.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modeSignOut} onPress={onSignOut}>
          <Text style={styles.modeSignOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
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
  },
  headerSubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 1,
  },
  signOutButton: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  modeButton: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  modeButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  signOutText: {
    color: colors.ink,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: "row",
    gap: 6,
    padding: 12,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.card,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 18,
    minHeight: 56,
    justifyContent: "center",
    paddingVertical: 7,
  },
  activeTabButton: {
    backgroundColor: colors.blue,
  },
  tabText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
  },
  activeTabText: {
    color: "#fff",
  },
  navIcon: {
    alignItems: "center",
    gap: 3,
    height: 19,
    justifyContent: "center",
    width: 22,
  },
  navIconRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    height: 19,
    justifyContent: "center",
    width: 22,
  },
  receiptIcon: {
    borderColor: colors.border,
    borderRadius: 3,
    borderWidth: 1,
  },
  iconBar: {
    borderRadius: 999,
    height: 3,
    width: 13,
  },
  iconBarWide: {
    width: 18,
  },
  iconBarShort: {
    width: 9,
  },
  iconDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  personDot: {
    borderRadius: 7,
    height: 13,
    width: 13,
  },
  personDotSmall: {
    height: 9,
    width: 9,
  },
  moreDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  modeShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
  modeCard: {
    width: "100%",
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 22,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  modeTitle: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: 8,
  },
  modeCopy: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 8,
  },
  primaryModeOption: {
    backgroundColor: colors.blue,
    borderRadius: 18,
    marginTop: 22,
    padding: 16,
  },
  primaryModeTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  primaryModeCopy: {
    color: "#dbeafe",
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 5,
  },
  secondaryModeOption: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  secondaryModeTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  secondaryModeCopy: {
    color: colors.muted,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 5,
  },
  modeSignOut: {
    alignItems: "center",
    marginTop: 18,
  },
  modeSignOutText: {
    color: colors.muted,
    fontWeight: "900",
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
