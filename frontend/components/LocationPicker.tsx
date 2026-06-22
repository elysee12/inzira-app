import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
      </View>

      {/* District */}
      {value.province && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Akarere / District</Text>
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
        </View>
      )}

      {/* Sector */}
      {value.district && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Umurenge / Sector</Text>
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
        </View>
      )}

      {/* Cell */}
      {value.sector && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Akagari / Cell</Text>
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
        </View>
      )}

      {/* Village */}
      {value.cell && (
        <View style={styles.pickerWrapper}>
          <Text style={[styles.label, { color: colors.foreground }]}>Umudugudu / Village</Text>
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
  pickerBox: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
  },
});
