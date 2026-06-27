import { useState, useEffect } from "react";
import { User, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-context";
import { authApi } from "../../lib/api";
import { Modal, FormField, inputClass } from "./Modal";
import { Button } from "./ui";

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Populate form when modal opens and user data is available
  useEffect(() => {
    if (open && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("profile");
    }
  }, [open, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser({ name, email, phone });
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profile Settings"
      size="md"
    >
      <div className="flex gap-2 mb-6 border-b pb-1">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-2 px-3 text-sm font-medium border-b-2 -mb-1 transition-colors ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="size-4" />
            Profile Info
          </div>
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`pb-2 px-3 text-sm font-medium border-b-2 -mb-1 transition-colors ${
            activeTab === "password"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="size-4" />
            Change Password
          </div>
        </button>
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <FormField label="Full Name">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </FormField>
          <FormField label="Email Address">
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </FormField>
          <FormField label="Phone Number">
            <input
              className={inputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </FormField>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormField label="Current Password">
            <input
              className={inputClass}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </FormField>
          <FormField label="New Password">
            <input
              className={inputClass}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </FormField>
          <FormField label="Confirm New Password">
            <input
              className={inputClass}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </FormField>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}