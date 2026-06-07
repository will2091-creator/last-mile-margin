import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { saveRouteCheckIn } from "../lib/mobileRepository";
import { useTheme } from "../ThemeContext";

export default function CheckInScreen({ onDataChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [routeName, setRouteName] = useState("");
  const [truck, setTruck] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!routeName.trim() || !truck.trim()) {
      setStatus("Route and truck are required before saving.");
      return;
    }

    setIsSaving(true);
    setStatus("");
    const result = await saveRouteCheckIn({ routeName: routeName.trim(), truck: truck.trim(), notes: notes.trim(), photoUrl: "" });
    setIsSaving(false);
    if (result.ok) {
      setRouteName("");
      setTruck("");
      setNotes("");
      setStatus("Route check-in saved.");
      onDataChange();
    } else {
      setStatus(result.error);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Route Check-In</Text>
      <Text style={styles.copy}>Use this for driver/team daily check-ins before it becomes a full route workflow.</Text>

      <Text style={styles.label}>Route</Text>
      <TextInput value={routeName} onChangeText={setRouteName} style={styles.input} placeholder="Example: Syracuse Appliance" />

      <Text style={styles.label}>Truck</Text>
      <TextInput value={truck} onChangeText={setTruck} style={styles.input} placeholder="Truck number" />

      <Text style={styles.label}>Notes</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline style={[styles.input, styles.notes]} placeholder="Route condition, delay, customer issue, or proof note" />

      <TouchableOpacity disabled={isSaving} style={styles.button} onPress={save}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Check-In</Text>}
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 6,
  },
  label: {
    color: colors.ink,
    fontWeight: "900",
    marginBottom: 7,
    marginTop: 16,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  notes: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  button: {
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: colors.blue,
    marginTop: 18,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
  },
  status: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: 12,
  },
});
