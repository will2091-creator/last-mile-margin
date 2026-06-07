import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadClaimEvidence } from "../lib/mobileRepository";
import { useTheme } from "../ThemeContext";

export default function EvidenceScreen({ onDataChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [claimId, setClaimId] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatus("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled) setSelectedAsset(result.assets[0]);
  };

  const upload = async () => {
    if (!claimId.trim() || !selectedAsset?.uri) {
      setStatus("Choose a claim ID and photo first.");
      return;
    }

    setIsUploading(true);
    setStatus("");
    const result = await uploadClaimEvidence({
      claimId: claimId.trim(),
      fileUri: selectedAsset.uri,
      fileName: selectedAsset.fileName || "claim-evidence.jpg",
      contentType: selectedAsset.mimeType || "image/jpeg",
    });
    setIsUploading(false);

    if (result.ok) {
      setStatus("Evidence uploaded.");
      setSelectedAsset(null);
      onDataChange();
    } else {
      setStatus(result.error);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Claim Evidence</Text>
      <Text style={styles.copy}>Attach field photos to a claim so web and mobile share the same evidence source.</Text>

      <Text style={styles.label}>Claim ID</Text>
      <TextInput value={claimId} onChangeText={setClaimId} autoCapitalize="characters" style={styles.input} placeholder="CLM-1009" />

      <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
        <Text style={styles.secondaryText}>{selectedAsset ? "Change Photo" : "Choose Photo"}</Text>
      </TouchableOpacity>

      {selectedAsset && <Text style={styles.fileText}>{selectedAsset.fileName || selectedAsset.uri}</Text>}

      <TouchableOpacity disabled={isUploading} style={styles.button} onPress={upload}>
        {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload Evidence</Text>}
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
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 14,
  },
  secondaryText: {
    color: colors.ink,
    fontWeight: "900",
  },
  fileText: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 10,
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
