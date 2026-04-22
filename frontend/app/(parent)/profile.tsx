import { Feather } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type ModalType = null | "profile" | "notifications" | "language" | "guidelines" | "help" | "edit_profile";

export default function ParentProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, userPhone, logout, updateUser } = useAuth();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [lessonNotif, setLessonNotif] = useState(true);
  const [tipNotif, setTipNotif] = useState(false);

  // Edit Profile State
  const [editName, setEditName] = useState(userName);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeModal === "edit_profile") {
      setEditName(userName);
      setEditPhone(userPhone);
    }
  }, [activeModal, userName, userPhone]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Ikitonderwa", "Izina rirabura.");
      return;
    }
    if (!editPhone.trim()) {
      Alert.alert("Ikitonderwa", "Nimero ya telefoni irabura.");
      return;
    }

    setSaving(true);
    const result = await updateUser({ name: editName.trim(), phone: editPhone.trim() });
    setSaving(false);

    if (result.success) {
      Alert.alert("Byagenze neza", "Umwirondoro wawe wahinduwe neza!");
      setActiveModal(null);
    } else {
      Alert.alert("Ikibazo", result.error || "Guhindura amakuru ntibyashobotse.");
    }
  };

  const menuItems = [
    { icon: "user", label: "Umwirondoro wanjye", sublabel: userName || "Umubyeyi", modal: "profile" as ModalType },
    { icon: "bell", label: "Amatangazo", sublabel: notifEnabled ? "Byifunguye" : "Bifunzwe", modal: "notifications" as ModalType },
    { icon: "globe", label: "Ururimi", sublabel: "Ikinyarwanda", modal: "language" as ModalType },
    { icon: "shield", label: "Amabwiriza y'ubuzima", sublabel: "Soma amabwiriza", modal: "guidelines" as ModalType },
    { icon: "help-circle", label: "Ubufasha", sublabel: "Twandikire", modal: "help" as ModalType },
  ];

  const renderModalContent = () => {
    switch (activeModal) {
      case "profile":
        return (
          <>
            <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
              <View style={[styles.bigAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.bigAvatarText}>{userName ? userName[0].toUpperCase() : "U"}</Text>
              </View>
              <Text style={[styles.infoName, { color: colors.foreground }]}>{userName || "Umubyeyi"}</Text>
              <View style={[styles.rolePill, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="users" size={12} color={colors.primary} />
                <Text style={[styles.rolePillText, { color: colors.primary }]}>Umubyeyi</Text>
              </View>
            </View>
            <InfoRow icon="phone" label="Telefoni" value={userPhone || "N/A"} colors={colors} />
            <InfoRow icon="calendar" label="Yiyandikishije" value="Mutarama 2025" colors={colors} />
            <InfoRow icon="book-open" label="Amasomo Yasomye" value="3 amasomo" colors={colors} />
            
            <TouchableOpacity 
              style={[styles.editBtn, { backgroundColor: colors.primary }]} 
              onPress={() => setActiveModal("edit_profile")}
            >
              <Feather name="edit-2" size={16} color="#fff" />
              <Text style={styles.editBtnText}>Hindura Umwirondoro</Text>
            </TouchableOpacity>

            <View style={[styles.infoHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={13} color={colors.mutedForeground} />
              <Text style={[styles.infoHintText, { color: colors.mutedForeground }]}>
                Kugira ngo uhindure amakuru yawe, twandikire kuri support@imirire.rw.
              </Text>
            </View>
          </>
        );

      case "notifications":
        return (
          <>
            <Text style={[styles.sectionHead, { color: colors.mutedForeground }]}>
              Hitamo amatangazo ushaka kubona
            </Text>
            <SettingToggle
              label="Amatangazo Yose"
              sublabel="Fungura cyangwa funga byose"
              value={notifEnabled}
              onChange={setNotifEnabled}
              colors={colors}
              accentColor={colors.primary}
            />
            <SettingToggle
              label="Amasomo Mashya"
              sublabel="Menya iyo isomo rishya ryashyizwe"
              value={lessonNotif}
              onChange={setLessonNotif}
              colors={colors}
              accentColor={colors.primary}
            />
            <SettingToggle
              label="Inama z'Imirire"
              sublabel="Akamenyetso k'imirire buri munsi"
              value={tipNotif}
              onChange={setTipNotif}
              colors={colors}
              accentColor={colors.primary}
            />
            <View style={[styles.infoHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="bell" size={13} color={colors.mutedForeground} />
              <Text style={[styles.infoHintText, { color: colors.mutedForeground }]}>
                Amatangazo azakugera kuri telefoni yawe iyo ufunguye ikoranabuhanga.
              </Text>
            </View>
          </>
        );

      case "language":
        return (
          <>
            <Text style={[styles.sectionHead, { color: colors.mutedForeground }]}>
              Hitamo ururimi rwa porogaramu
            </Text>
            {[
              { code: "rw", name: "Ikinyarwanda", native: "Kinyarwanda", available: true },
              { code: "fr", name: "Igifaransa", native: "Français", available: false },
              { code: "en", name: "Icyongereza", native: "English", available: false },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  {
                    backgroundColor: lang.code === "rw" ? colors.primary + "15" : colors.card,
                    borderColor: lang.code === "rw" ? colors.primary : colors.border,
                    opacity: lang.available ? 1 : 0.5,
                  },
                ]}
                disabled={!lang.available}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langName, { color: colors.foreground }]}>{lang.name}</Text>
                  <Text style={[styles.langNative, { color: colors.mutedForeground }]}>{lang.native}</Text>
                </View>
                {lang.code === "rw" ? (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={14} color="#fff" />
                  </View>
                ) : (
                  <View style={[styles.soonBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.soonText, { color: colors.mutedForeground }]}>Vuba</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        );

      case "guidelines":
        return (
          <>
            {[
              {
                icon: "heart",
                title: "Konka gusa amata ya nyina (0-6 amezi)",
                body: "Mu mezi 6 ya mbere, umwana agomba konka amata ya nyina gusa. Aya mata afite byose umwana akeneye.",
              },
              {
                icon: "droplet",
                title: "Amazi asukuye (Igihe cyose)",
                body: "Buri gihe ha umwana amazi asukuye. Irinda guha amazi y'ibirayi cyangwa amababi y'imboga kuri umwana w'amezi 0-6.",
              },
              {
                icon: "sun",
                title: "Ibiryo byinshi (7-24 amezi)",
                body: "Tangira guha umwana ibiryo bya mbere amezi 6 yuzuye. Guteranya amata yo konka n'ibiryo byinshi ni ingenzi.",
              },
              {
                icon: "shield",
                title: "Ikurikirana ry'umutima (25-59 amezi)",
                body: "Gira ngo umwana arabanye n'ibiro n'uburebure buhuje n'imyaka ye. Jya ufata umwana ku muganga ku myaka itandukanye.",
              },
              {
                icon: "alert-triangle",
                title: "Ibiryo bibujijwe",
                body: "Irinda guha umwana w'amezi 0-6 amazi, isupu, cyangwa ibindi binyobwa. Amata ya nyina asumba byose.",
              },
            ].map((g, i) => (
              <View key={i} style={[styles.guideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.guideIconWrap, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name={g.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guideTitle, { color: colors.foreground }]}>{g.title}</Text>
                  <Text style={[styles.guideBody, { color: colors.mutedForeground }]}>{g.body}</Text>
                </View>
              </View>
            ))}
          </>
        );

      case "help":
        return (
          <>
            <FaqItem
              q="Nshobora nte guhindura ijambo ry'ibanga?"
              a="Sohoka, hanyuma kanda 'Wibagiwe ijambo ry'ibanga?' ku ipaji yo kwinjira. Uzahabwa kode OTP kuri imeli yawe."
              colors={colors}
            />
            <FaqItem
              q="Amakuru y'umwana bari hehe?"
              a="Inyigisho zose zirashingiye ku myaka y'umwana wawe. Hitamo ikiciro cy'umwana kuri paji ya 'Ahabanza'."
              colors={colors}
            />
            <FaqItem
              q="Nshobora gufungura konti nshya?"
              a="Yego. Sohoka, hanyuma kanda 'Fungura konti nshya' kuri paji yo kwinjira."
              colors={colors}
            />
            <FaqItem
              q="Porogaramu ikora nta interineti?"
              a="Yego! Amasomo yose abitswe ku telefoni. Ntukeneye interineti ngo urebe inyigisho."
              colors={colors}
            />
            <View style={[styles.contactBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Feather name="mail" size={18} color={colors.primary} />
              <View>
                <Text style={[styles.contactLabel, { color: colors.primary }]}>Twandikire</Text>
                <Text style={[styles.contactValue, { color: colors.foreground }]}>support@imirire.rw</Text>
              </View>
            </View>
          </>
        );

      case "edit_profile":
        return (
          <View style={styles.editForm}>
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: colors.foreground }]}>Izina ryuzuye</Text>
              <View style={[styles.editInputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.editInput, { color: colors.foreground }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Izina ryawe"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: colors.foreground }]}>Nimero ya Telefoni</Text>
              <View style={[styles.editInputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <Feather name="phone" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.editInput, { color: colors.foreground }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="07X XXX XXXX"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveEditBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]} 
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              <Text style={styles.saveEditBtnText}>{saving ? "Biri kubikwa..." : "Bika Impinduka"}</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const modalTitles: Record<NonNullable<ModalType>, string> = {
    profile: "Umwirondoro wanjye",
    notifications: "Amatangazo",
    language: "Ururimi",
    guidelines: "Amabwiriza y'Ubuzima",
    help: "Ubufasha",
    edit_profile: "Hindura Umwirondoro",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Umwirondoro" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{userName ? userName[0].toUpperCase() : "U"}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{userName || "Umubyeyi"}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="users" size={11} color={colors.primary} />
              <Text style={[styles.roleLabel, { color: colors.primary }]}>Umubyeyi</Text>
            </View>
          </View>
        </View>

        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.icon}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => setActiveModal(item.modal)}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sublabel}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: "#FEE2E2" }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Sohoka</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Verisiyo 1.0.0 • Imirire App
        </Text>
      </ScrollView>

      <Modal visible={activeModal !== null} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {activeModal ? modalTitles[activeModal] : ""}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={[infoStyles.row, { borderBottomColor: colors.border }]}>
      <Feather name={icon} size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function SettingToggle({ label, sublabel, value, onChange, colors, accentColor }: any) {
  return (
    <View style={[settingStyles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[settingStyles.label, { color: colors.foreground }]}>{label}</Text>
        {sublabel && <Text style={[settingStyles.sub, { color: colors.mutedForeground }]}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: accentColor + "60" }}
        thumbColor={value ? accentColor : colors.mutedForeground}
      />
    </View>
  );
}

function FaqItem({ q, a, colors }: any) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[faqStyles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.8}
    >
      <View style={faqStyles.qRow}>
        <Text style={[faqStyles.q, { color: colors.foreground }]}>{q}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </View>
      {open && <Text style={[faqStyles.a, { color: colors.mutedForeground }]}>{a}</Text>}
    </TouchableOpacity>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontSize: 11, fontFamily: "Inter_400Regular" },
  value: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 2 },
});

const settingStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  label: { fontSize: 15, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

const faqStyles = StyleSheet.create({
  item: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  qRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  q: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  a: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 8 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  profileCard: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 16, borderWidth: 1, gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  profileInfo: { gap: 6 },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  roleBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4, alignSelf: "flex-start" },
  roleLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, gap: 8 },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  version: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalContent: { padding: 20, gap: 12, paddingBottom: 40 },
  // Modals
  infoCard: { alignItems: "center", padding: 24, borderRadius: 16, gap: 10, marginBottom: 8 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  bigAvatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  infoName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  rolePill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, gap: 4 },
  rolePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  infoHint: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  infoHintText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sectionHead: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  langOption: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1.5 },
  langName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  langNative: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  soonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  soonText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  guideCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  guideIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  guideTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  guideBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  contactBox: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  contactLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  contactValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  editBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  editForm: { gap: 16, paddingVertical: 8 },
  editField: { gap: 8 },
  editLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  editInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  editInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveEditBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveEditBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
