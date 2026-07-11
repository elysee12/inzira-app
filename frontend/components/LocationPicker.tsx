import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

// Import the JSON data
const rwandaLocationsData = require('@/assets/rwanda_locations.json');

interface LocationData {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const colors = useColors();
  const [districts, setDistricts] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [cells, setCells] = useState<any[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  
  // iOS Modal states
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showCellModal, setShowCellModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);

  // Get provinces array safely - the JSON uses "items" as root property
  const provinces = rwandaLocationsData?.items || [];

  // Update districts when province changes
  useEffect(() => {
    if (value.province) {
      const province = provinces.find((p: any) => p.name === value.province);
      setDistricts(province?.districts || []);
      if (province && !province.districts?.find((d: any) => d.name === value.district)) {
        onChange({ ...value, district: '', sector: '', cell: '', village: '' });
      }
    } else {
      setDistricts([]);
    }
  }, [value.province]);

  // Update sectors when district changes
  useEffect(() => {
    if (value.district) {
      const province = provinces.find((p: any) => p.name === value.province);
      const district = province?.districts?.find((d: any) => d.name === value.district);
      setSectors(district?.sectors || []);
      if (district && !district.sectors?.find((s: any) => s.name === value.sector)) {
        onChange({ ...value, sector: '', cell: '', village: '' });
      }
    } else {
      setSectors([]);
    }
  }, [value.district]);

  // Update cells when sector changes
  useEffect(() => {
    if (value.sector) {
      const province = provinces.find((p: any) => p.name === value.province);
      const district = province?.districts?.find((d: any) => d.name === value.district);
      const sector = district?.sectors?.find((s: any) => s.name === value.sector);
      setCells(sector?.cells || []);
      if (sector && !sector.cells?.find((c: any) => c.name === value.cell)) {
        onChange({ ...value, cell: '', village: '' });
      }
    } else {
      setCells([]);
    }
  }, [value.sector]);

  // Update villages when cell changes
  useEffect(() => {
    if (value.cell) {
      const province = provinces.find((p: any) => p.name === value.province);
      const district = province?.districts?.find((d: any) => d.name === value.district);
      const sector = district?.sectors?.find((s: any) => s.name === value.sector);
      const cell = sector?.cells?.find((c: any) => c.name === value.cell);
      setVillages(cell?.villages || []);
      if (cell && !cell.villages?.includes(value.village)) {
        onChange({ ...value, village: '' });
      }
    } else {
      setVillages([]);
    }
  }, [value.cell]);

  return (
    <View style={styles.container}>
      {/* Province */}
      <View style={styles.pickerWrapper}>
        <Text style={[styles.label, { color: colors.foreground }]}>Intara / Province</Text>
        {Platform.OS === 'ios' ? (
          <>
            <TouchableOpacity
              style={[styles.iosPickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowProvinceModal(true)}
            >
              <Text style={[styles.iosPickerText, { color: value.province ? colors.foreground : colors.mutedForeground }]}>
                {value.province || 'Hitamo intara...'}
              </Text>
              <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            
            <Modal visible={showProvinceModal} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Hitamo Intara</Text>
                    <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                      <Feather name="x" size={24} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {provinces.map((province: any) => (
                      <TouchableOpacity
                        key={province.name}
                        style={[styles.modalItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          onChange({ province: province.name, district: '', sector: '', cell: '', village: '' });
                          setShowProvinceModal(false);
                        }}
                      >
                        <Text style={[styles.modalItemText, { color: colors.foreground }]}>{province.name}</Text>
                        {value.province === province.name && (
                          <Feather name="check" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={value.province}
              onValueChange={(itemValue) => onChange({ province: itemValue, district: '', sector: '', cell: '', village: '' })}
              style={[styles.picker, { color: colors.foreground }]}
            >
              <Picker.Item label="Hitamo intara..." value="" />
              {provinces.map((province: any) => (
                <Picker.Item key={province.name} label={province.name} value={province.name} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {/* District */}
      {value.province && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Akarere / District</Text>
          {Platform.OS === 'ios' ? (
            <>
              <TouchableOpacity
                style={[styles.iosPickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDistrictModal(true)}
              >
                <Text style={[styles.iosPickerText, { color: value.district ? colors.foreground : colors.mutedForeground }]}>
                  {value.district || 'Hitamo akarere...'}
                </Text>
                <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              
              <Modal visible={showDistrictModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Hitamo Akarere</Text>
                      <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                        <Feather name="x" size={24} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      {districts.map((district: any) => (
                        <TouchableOpacity
                          key={district.name}
                          style={[styles.modalItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            onChange({ ...value, district: district.name, sector: '', cell: '', village: '' });
                            setShowDistrictModal(false);
                          }}
                        >
                          <Text style={[styles.modalItemText, { color: colors.foreground }]}>{district.name}</Text>
                          {value.district === district.name && (
                            <Feather name="check" size={20} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={value.district}
                onValueChange={(itemValue) => onChange({ ...value, district: itemValue, sector: '', cell: '', village: '' })}
                style={[styles.picker, { color: colors.foreground }]}
              >
                <Picker.Item label="Hitamo akarere..." value="" />
                {districts.map((district: any) => (
                  <Picker.Item key={district.name} label={district.name} value={district.name} />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}

      {/* Sector */}
      {value.district && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Umurenge / Sector</Text>
          {Platform.OS === 'ios' ? (
            <>
              <TouchableOpacity
                style={[styles.iosPickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowSectorModal(true)}
              >
                <Text style={[styles.iosPickerText, { color: value.sector ? colors.foreground : colors.mutedForeground }]}>
                  {value.sector || 'Hitamo umurenge...'}
                </Text>
                <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              
              <Modal visible={showSectorModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Hitamo Umurenge</Text>
                      <TouchableOpacity onPress={() => setShowSectorModal(false)}>
                        <Feather name="x" size={24} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      {sectors.map((sector: any) => (
                        <TouchableOpacity
                          key={sector.name}
                          style={[styles.modalItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            onChange({ ...value, sector: sector.name, cell: '', village: '' });
                            setShowSectorModal(false);
                          }}
                        >
                          <Text style={[styles.modalItemText, { color: colors.foreground }]}>{sector.name}</Text>
                          {value.sector === sector.name && (
                            <Feather name="check" size={20} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={value.sector}
                onValueChange={(itemValue) => onChange({ ...value, sector: itemValue, cell: '', village: '' })}
                style={[styles.picker, { color: colors.foreground }]}
              >
                <Picker.Item label="Hitamo umurenge..." value="" />
                {sectors.map((sector: any) => (
                  <Picker.Item key={sector.name} label={sector.name} value={sector.name} />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}

      {/* Cell */}
      {value.sector && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Akagari / Cell</Text>
          {Platform.OS === 'ios' ? (
            <>
              <TouchableOpacity
                style={[styles.iosPickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowCellModal(true)}
              >
                <Text style={[styles.iosPickerText, { color: value.cell ? colors.foreground : colors.mutedForeground }]}>
                  {value.cell || 'Hitamo akagari...'}
                </Text>
                <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              
              <Modal visible={showCellModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Hitamo Akagari</Text>
                      <TouchableOpacity onPress={() => setShowCellModal(false)}>
                        <Feather name="x" size={24} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      {cells.map((cell: any) => (
                        <TouchableOpacity
                          key={cell.name}
                          style={[styles.modalItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            onChange({ ...value, cell: cell.name, village: '' });
                            setShowCellModal(false);
                          }}
                        >
                          <Text style={[styles.modalItemText, { color: colors.foreground }]}>{cell.name}</Text>
                          {value.cell === cell.name && (
                            <Feather name="check" size={20} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={value.cell}
                onValueChange={(itemValue) => onChange({ ...value, cell: itemValue, village: '' })}
                style={[styles.picker, { color: colors.foreground }]}
              >
                <Picker.Item label="Hitamo akagari..." value="" />
                {cells.map((cell: any) => (
                  <Picker.Item key={cell.name} label={cell.name} value={cell.name} />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}

      {/* Village */}
      {value.cell && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Umudugudu / Village</Text>
          {Platform.OS === 'ios' ? (
            <>
              <TouchableOpacity
                style={[styles.iosPickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowVillageModal(true)}
              >
                <Text style={[styles.iosPickerText, { color: value.village ? colors.foreground : colors.mutedForeground }]}>
                  {value.village || 'Hitamo umudugudu...'}
                </Text>
                <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              
              <Modal visible={showVillageModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Hitamo Umudugudu</Text>
                      <TouchableOpacity onPress={() => setShowVillageModal(false)}>
                        <Feather name="x" size={24} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      {villages.map((village: string) => (
                        <TouchableOpacity
                          key={village}
                          style={[styles.modalItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            onChange({ ...value, village });
                            setShowVillageModal(false);
                          }}
                        >
                          <Text style={[styles.modalItemText, { color: colors.foreground }]}>{village}</Text>
                          {value.village === village && (
                            <Feather name="check" size={20} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <View style={[styles.pickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                selectedValue={value.village}
                onValueChange={(itemValue) => onChange({ ...value, village: itemValue })}
                style={[styles.picker, { color: colors.foreground }]}
              >
                <Picker.Item label="Hitamo umudugudu..." value="" />
                {villages.map((village: string) => (
                  <Picker.Item key={village} label={village} value={village} />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pickerWrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  // Android Picker styles
  pickerBox: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    fontSize: 14,
  },
  // iOS Button styles
  iosPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  iosPickerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
});
