import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { currency, theme } from "../theme";
import { extractReceiptInfo, loadOwnerCommandCenter, updateReceiptStatus, uploadExpenseReceipt } from "../lib/mobileRepository";

const receiptTabs = ["Pending Approval", "Approved", "Attached to Profit"];
const categories = ["Fuel", "Repairs", "Tools", "Maintenance", "Tolls", "Supplies"];

export default function ReceiptsScreen({ refreshToken, onDataChange }) {
  const [receipts, setReceipts] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending Approval");
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [category, setCategory] = useState("Fuel");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [status, setStatus] = useState("Loading receipt approvals...");
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showAddReceipt, setShowAddReceipt] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadOwnerCommandCenter().then((result) => {
      if (!isMounted) return;
      if (result.ok) {
        const nextReceipts = result.summary?.receipts || [];
        setReceipts(nextReceipts);
        setSelectedReceiptId((current) => current || nextReceipts[0]?.id || null);
        setStatus(`${nextReceipts.length} receipt${nextReceipts.length === 1 ? "" : "s"} loaded.`);
      } else {
        setStatus(result.error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const groupedReceipts = useMemo(() => groupReceipts(receipts), [receipts]);
  const visibleReceipts = groupedReceipts[activeTab] || [];
  const selectedReceipt = receipts.find((receipt) => receipt.id === selectedReceiptId) || visibleReceipts[0] || receipts[0] || null;
  const pendingTotal = groupedReceipts["Pending Approval"].reduce((sum, receipt) => sum + getReceiptAmount(receipt), 0);

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

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setStatus("Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled) {
      setSelectedAsset(result.assets[0]);
      setStatus("Receipt captured. Analyze it or upload for approval.");
    }
  };

  const analyzeReceipt = async () => {
    if (!selectedAsset?.uri) {
      setStatus("Take or choose a receipt photo first.");
      return;
    }

    setIsExtracting(true);
    setStatus("Reading receipt...");
    const imageBase64 = await FileSystem.readAsStringAsync(selectedAsset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const result = await extractReceiptInfo({
      imageBase64,
      contentType: selectedAsset.mimeType || "image/jpeg",
    });
    setIsExtracting(false);

    if (result.ok) {
      const next = result.receipt;
      const nextCategory = normalizeCategory(next.expenseType);
      if (nextCategory) setCategory(nextCategory);
      if (next.vendor) setVendor(next.vendor);
      if (next.amount) setAmount(next.amount);
      if (next.notes) setNotes(next.notes);
      setStatus(`Receipt filled${next.confidence ? ` (${next.confidence}% confidence)` : ""}. Approve after upload.`);
    } else {
      setStatus(result.error);
    }
  };

  const upload = async () => {
    if (!selectedAsset?.uri) {
      setStatus("Choose a receipt photo first.");
      return;
    }

    setIsUploading(true);
    setStatus("");
    const result = await uploadExpenseReceipt({
      fileUri: selectedAsset.uri,
      fileName: selectedAsset.fileName || `${category.toLowerCase()}-receipt.jpg`,
      contentType: selectedAsset.mimeType || "image/jpeg",
      expenseType: category,
      vendor,
      amount,
      notes,
    });
    setIsUploading(false);

    if (result.ok) {
      setStatus("Receipt uploaded and awaiting approval.");
      setSelectedAsset(null);
      setVendor("");
      setAmount("");
      setNotes("");
      setShowAddReceipt(false);
      onDataChange?.();
    } else {
      setStatus(result.error);
    }
  };

  const updateReceipt = async (receipt, nextStatus) => {
    setStatus(`Updating ${receipt.name || "receipt"}...`);
    const result = await updateReceiptStatus(receipt.id, nextStatus);
    if (result.ok) {
      setStatus(`Receipt marked ${nextStatus}.`);
      onDataChange?.();
    } else {
      setStatus(result.error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Receipt Approvals</Text>
            <Text style={styles.title}>Control expenses</Text>
            <Text style={styles.copy}>{currency.format(pendingTotal)} pending approval</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddReceipt((current) => !current)}>
            <Text style={styles.addButtonText}>{showAddReceipt ? "Close" : "Add"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {receiptTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={[styles.tab, isActive && styles.activeTab]} onPress={() => {
              setActiveTab(tab);
              setSelectedReceiptId((groupedReceipts[tab] || [])[0]?.id || null);
            }}>
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              <Text style={[styles.tabCount, isActive && styles.activeTabText]}>{groupedReceipts[tab]?.length || 0}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showAddReceipt && (
        <View style={styles.addPanel}>
          <Text style={styles.panelTitle}>New receipt</Text>
          <View style={styles.categoryGrid}>
            {categories.map((item) => {
              const isActive = category === item;
              return (
                <TouchableOpacity key={item} style={[styles.categoryButton, isActive && styles.activeCategoryButton]} onPress={() => setCategory(item)}>
                  <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput value={vendor} onChangeText={setVendor} style={styles.input} placeholder="Vendor" />
          <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} placeholder="Amount" />
          <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.notesInput]} multiline placeholder="Notes" />
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
              <Text style={styles.secondaryButtonText}>Use Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <Text style={styles.secondaryButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
          {selectedAsset && <Text style={styles.fileText}>{selectedAsset.fileName || "Receipt photo selected"}</Text>}
          <TouchableOpacity disabled={isExtracting || !selectedAsset} style={[styles.analyzeButton, (!selectedAsset || isExtracting) && styles.disabledButton]} onPress={analyzeReceipt}>
            {isExtracting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze Receipt</Text>}
          </TouchableOpacity>
          <TouchableOpacity disabled={isUploading || !selectedAsset} style={[styles.uploadButton, (!selectedAsset || isUploading) && styles.disabledButton]} onPress={upload}>
            {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload for Approval</Text>}
          </TouchableOpacity>
        </View>
      )}

      {selectedReceipt && (
        <View style={styles.detailCard}>
          <Text style={styles.detailKicker}>Next Action</Text>
          <Text style={styles.detailTitle}>{getReceiptNextAction(selectedReceipt)}</Text>
          <View style={styles.receiptImageBox}>
            <Text style={styles.receiptImageTitle}>Receipt Image</Text>
            <Text style={styles.receiptImageCopy}>{selectedReceipt.file_name || "Stored receipt image"}</Text>
          </View>
          <View style={styles.detailGrid}>
            <Detail label="Amount" value={currency.format(getReceiptAmount(selectedReceipt))} tone="amber" />
            <Detail label="Vendor" value={getReceiptVendor(selectedReceipt)} />
            <Detail label="Category" value={getReceiptCategory(selectedReceipt)} />
            <Detail label="Date" value={formatDate(selectedReceipt.uploaded_at || selectedReceipt.created_at)} />
            <Detail label="Status" value={selectedReceipt.status || "Uploaded"} />
            <Detail label="Notes" value={selectedReceipt.notes || "No notes"} />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.approveButton} onPress={() => updateReceipt(selectedReceipt, "Approved")}>
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => updateReceipt(selectedReceipt, "Rejected")}>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.attachButton} onPress={() => updateReceipt(selectedReceipt, "Attached to Profitability")}>
            <Text style={styles.buttonText}>Attach to Profitability</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.status}>{status}</Text>

      {visibleReceipts.map((receipt) => (
        <TouchableOpacity key={receipt.id} style={[styles.receiptCard, selectedReceipt?.id === receipt.id && styles.selectedReceiptCard]} onPress={() => setSelectedReceiptId(receipt.id)}>
          <View style={styles.receiptTop}>
            <View style={styles.receiptMain}>
              <Text style={styles.receiptVendor}>{getReceiptVendor(receipt)}</Text>
              <Text style={styles.receiptMeta}>{getReceiptCategory(receipt)} · {formatDate(receipt.uploaded_at || receipt.created_at)}</Text>
            </View>
            <Text style={styles.receiptAmount}>{currency.format(getReceiptAmount(receipt))}</Text>
          </View>
          <Text style={styles.receiptStatus}>{receipt.status || "Uploaded"}</Text>
        </TouchableOpacity>
      ))}

      {!visibleReceipts.length && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No receipts here</Text>
          <Text style={styles.emptyCopy}>This approval lane is clear.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function groupReceipts(receipts) {
  return receiptTabs.reduce((groups, tab) => {
    groups[tab] = receipts.filter((receipt) => classifyReceipt(receipt) === tab);
    return groups;
  }, {});
}

function classifyReceipt(receipt) {
  const status = String(receipt.status || "").toLowerCase();
  if (/attached/.test(status)) return "Attached to Profit";
  if (/approved|reviewed/.test(status)) return "Approved";
  return "Pending Approval";
}

function getReceiptNextAction(receipt) {
  const group = classifyReceipt(receipt);
  if (group === "Attached to Profit") return "Expense already affects margin";
  if (group === "Approved") return "Attach this receipt to profitability";
  return "Approve or reject this expense";
}

function normalizeCategory(value) {
  const text = String(value || "").toLowerCase();
  if (/gas|fuel/.test(text)) return "Fuel";
  if (/repair/.test(text)) return "Repairs";
  if (/tool/.test(text)) return "Tools";
  if (/maintenance/.test(text)) return "Maintenance";
  if (/toll|parking/.test(text)) return "Tolls";
  if (/suppl/.test(text)) return "Supplies";
  return null;
}

function getReceiptAmount(receipt) {
  const match = String(receipt?.notes || "").match(/Amount:\s*([0-9]+(?:\.[0-9]+)?)/i);
  return match ? Number(match[1] || 0) : 0;
}

function getReceiptVendor(receipt) {
  const match = String(receipt?.notes || "").match(/Vendor:\s*([^|]+)/i);
  return match ? match[1].trim() : receipt?.name || "Unknown vendor";
}

function getReceiptCategory(receipt) {
  const match = String(receipt?.notes || "").match(/^([^|]+?) expense/i);
  return normalizeCategory(match?.[1]) || normalizeCategory(receipt?.name) || "Supplies";
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function Detail({ label, value, tone = "ink" }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, styles[`${tone}Text`] || styles.inkText]} numberOfLines={2}>{value}</Text>
    </View>
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
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  headerCopy: {
    flex: 1,
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
  addButton: {
    backgroundColor: theme.colors.blue,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tab: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  tabText: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  tabCount: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  activeTabText: {
    color: "#fff",
  },
  addPanel: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  panelTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  activeCategoryButton: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  categoryText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  activeCategoryText: {
    color: "#fff",
  },
  input: {
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: theme.colors.ink,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  notesInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  photoActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: theme.colors.ink,
    fontWeight: "900",
  },
  fileText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  analyzeButton: {
    alignItems: "center",
    backgroundColor: theme.colors.blue,
    borderRadius: 14,
    paddingVertical: 12,
  },
  uploadButton: {
    alignItems: "center",
    backgroundColor: theme.colors.green,
    borderRadius: 14,
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
  },
  detailCard: {
    backgroundColor: theme.colors.card,
    borderColor: "#bfdbfe",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  detailKicker: {
    color: theme.colors.blue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  receiptImageBox: {
    backgroundColor: "#f8fafc",
    borderColor: theme.colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  receiptImageTitle: {
    color: theme.colors.ink,
    fontWeight: "900",
  },
  receiptImageCopy: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  detailItem: {
    backgroundColor: "#f8fafc",
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    padding: 10,
  },
  detailLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailValue: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  approveButton: {
    alignItems: "center",
    backgroundColor: theme.colors.green,
    borderRadius: 14,
    flex: 1,
    paddingVertical: 12,
  },
  rejectButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  rejectButtonText: {
    color: theme.colors.red,
    fontWeight: "900",
  },
  attachButton: {
    alignItems: "center",
    backgroundColor: theme.colors.blue,
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 12,
  },
  status: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  receiptCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  selectedReceiptCard: {
    borderColor: theme.colors.blue,
  },
  receiptTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  receiptMain: {
    flex: 1,
  },
  receiptVendor: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  receiptMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  receiptAmount: {
    color: theme.colors.amber,
    fontSize: 19,
    fontWeight: "900",
  },
  receiptStatus: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
    paddingTop: 9,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  emptyCopy: {
    color: theme.colors.muted,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 5,
    textAlign: "center",
  },
  inkText: {
    color: theme.colors.ink,
  },
  amberText: {
    color: theme.colors.amber,
  },
});
