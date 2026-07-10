import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import apiClient from "@/context/apiClient";
import { useColors } from "@/hooks/useColors";

interface Facility {
  id: number;
  name: string;
  type: string;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
}

interface FacilityPickerProps {
  value: number | null;
  onChange: (facilityId: number | null, facilityName: string) => void;
  placeholder?: string;
  /** When provided, only show facilities in this district */
  filterDistrict?: string;
  /** When provided, only show facilities in this sector */
  filterSector?: string;
}

export default function FacilityPicker({
  value,
  onChange,
  placeholder,
  filterDistrict,
  filterSector,
}: FacilityPickerProps) {
  const colors = useColors();
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Keep selectedFacility in sync with value prop
  useEffect(() => {
    if (!value) { setSelectedFacility(null); return; }
    const found = allFacilities.find((f) => f.id === value);
    if (found) setSelectedFacility(found);
  }, [value, allFacilities]);

  // Clear selection when filters change and the selected facility no longer matches
  useEffect(() => {
    if (!selectedFacility) return;
    const stillValid = matchesFilter(selectedFacility);
    if (!stillValid) {
      setSelectedFacility(null);
      onChange(null, "");
    }
  }, [filterDistrict, filterSector]);

  function matchesFilter(f: Facility): boolean {
    if (filterDistrict && filterSector) {
      return (
        f.district?.toLowerCase() === filterDistrict.toLowerCase() &&
        f.sector?.toLowerCase() === filterSector.toLowerCase()
      );
    }
    if (filterDistrict) {
      return f.district?.toLowerCase() === filterDistrict.toLowerCase();
    }
    return true;
  }

  // Derived list — re-compute whenever filters or the full list changes
  const filtered = useMemo(() => allFacilities.filter(matchesFilter), [allFacilities, filterDistrict, filterSector]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await apiClient.get("/facilities");
      setAllFacilities(response.data || []);
    } catch {
      setError(true);
      setAllFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (facility: Facility) => {
    setSelectedFacility(facility);
    onChange(facility.id, facility.name);
    setModalVisible(false);
  };

  const handleClear = () => {
    setSelectedFacility(null);
    onChange(null, "");
  };

  // Decide what the trigger button shows
  const isDisabled = loading || (!filterDistrict && !filterSector && allFacilities.length === 0);
  const needsLocation = !filterDistrict;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.picker,
          { borderColor: needsLocation ? colors.border : colors.primary + "66", backgroundColor: colors.card },
          needsLocation && styles.pickerDisabled,
        ]}
        onPress={() => !needsLocation && setModalVisible(true)}
        activeOpacity={needsLocation ? 1 : 0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Feather
              name="activity"
              size={16}
              color={needsLocation ? colors.mutedForeground : colors.primary}
            />
            <View style={{ flex: 1 }}>
              {selectedFacility ? (
                <>
                  <Text style={[styles.selectedName, { color: colors.foreground }]}>
                    {selectedFacility.name}
                  </Text>
                  <Text style={[styles.selectedDetails, { color: colors.mutedForeground }]}>
                    {selectedFacility.type}
                    {selectedFacility.district && ` • ${selectedFacility.district}`}
                  </Text>
                </>
              ) : (
                <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>
                  {needsLocation
                    ? "Hitamo aho utuye mbere..."
                    : filtered.length === 0
                    ? "Nta bigo bihari muri ako karere"
                    : placeholder || "Hitamo ikigo cy'ubuzima"}
                </Text>
              )}
            </View>
            {selectedFacility ? (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : (
              <Feather
                name="chevron-down"
                size={20}
                color={needsLocation ? colors.mutedForeground : colors.primary}
              />
            )}
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Hitamo Ikigo cy'Ubuzima
                </Text>
                {filterDistrict && (
                  <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                    {[filterSector, filterDistrict].filter(Boolean).join(", ")}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {error ? (
              <View style={styles.emptyState}>
                <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Ntibyashobotse gufata amakuru
                </Text>
                <TouchableOpacity onPress={fetchFacilities} style={[styles.retryBtn, { borderColor: colors.primary }]}>
                  <Text style={[styles.retryText, { color: colors.primary }]}>Gerageza nanone</Text>
                </TouchableOpacity>
              </View>
            ) : filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="map-pin" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Nta bigo bihari
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {filterDistrict
                    ? `Nta bigo by'ubuzima bihari muri ${filterSector ?? filterDistrict}`
                    : "Nta bigo by'ubuzima bihari"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.facilityItem,
                      {
                        backgroundColor:
                          selectedFacility?.id === item.id
                            ? colors.primary + "12"
                            : "transparent",
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    {/* Icon */}
                    <View style={[styles.facilityIcon, { backgroundColor: colors.primary + "15" }]}>
                      <Feather name="activity" size={18} color={colors.primary} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.facilityName, { color: colors.foreground }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.facilityDetails, { color: colors.mutedForeground }]}>
                        {[item.type, item.sector, item.district].filter(Boolean).join(" • ")}
                      </Text>
                    </View>

                    {selectedFacility?.id === item.id && (
                      <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 24 }}
                ItemSeparatorComponent={() => null}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    minHeight: 54,
  },
  pickerDisabled: {
    opacity: 0.55,
  },
  selectedName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  selectedDetails: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  placeholder: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  clearBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  facilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  facilityName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  facilityDetails: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
