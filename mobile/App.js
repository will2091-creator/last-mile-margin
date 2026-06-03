import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ClaimsScreen from "./src/screens/ClaimsScreen";
import CheckInScreen from "./src/screens/CheckInScreen";
import EvidenceScreen from "./src/screens/EvidenceScreen";
import { supabase } from "./src/lib/supabaseClient";
import { theme } from "./src/theme";

const tabs = [
  { key: "home", label: "Home" },
  { key: "claims", label: "Claims" },
  { key: "checkIn", label: "Check In" },
  { key: "evidence", label: "Evidence" },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session || null);
      setIsLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const screenProps = useMemo(
    () => ({
      session,
      refreshToken,
      onDataChange: () => setRefreshToken((current) => current + 1),
    }),
    [refreshToken, session]
  );

  if (isLoadingSession) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={theme.colors.blue} />
        <Text style={styles.loadingText}>Loading Final Mile Margin...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Final Mile Margin</Text>
          <Text style={styles.title}>Field App</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === "home" && <HomeScreen {...screenProps} />}
        {activeTab === "claims" && <ClaimsScreen {...screenProps} />}
        {activeTab === "checkIn" && <CheckInScreen {...screenProps} />}
        {activeTab === "evidence" && <EvidenceScreen {...screenProps} />}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[styles.tabButton, isActive && styles.activeTabButton]} onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.muted,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  kicker: {
    color: theme.colors.blue,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 30,
    fontWeight: "900",
  },
  signOutButton: {
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  signOutText: {
    color: theme.colors.ink,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 10,
  },
  activeTabButton: {
    backgroundColor: theme.colors.blue,
  },
  tabText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  activeTabText: {
    color: "#fff",
  },
});
