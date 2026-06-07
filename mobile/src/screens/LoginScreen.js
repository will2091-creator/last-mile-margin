import React, { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../ThemeContext";

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signIn = async () => {
    setIsSubmitting(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsSubmitting(false);
    if (error) setMessage(error.message);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.shell}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Final Mile Margin</Text>
        <Text style={styles.title}>Mobile Field App</Text>
        <Text style={styles.copy}>Use the same Supabase login as the web dashboard.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="username" style={styles.input} placeholder="you@example.com" />

        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry textContentType="password" style={styles.input} placeholder="Password" />

        <TouchableOpacity disabled={isSubmitting} style={styles.button} onPress={signIn}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        {message ? <Text style={styles.error}>{message}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  card: {
    borderRadius: 24,
    backgroundColor: colors.card,
    padding: 22,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  kicker: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900",
  },
  copy: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    color: colors.ink,
    fontWeight: "900",
  },
  input: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.ink,
    fontWeight: "800",
  },
  button: {
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.blue,
    marginTop: 22,
    paddingVertical: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
  },
  error: {
    marginTop: 14,
    color: colors.red,
    fontWeight: "800",
  },
});
