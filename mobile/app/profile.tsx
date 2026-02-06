import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import imageCompression from "browser-image-compression";
import { API_BASE_URL } from "../shared/constants/config";
import { useUser } from "../shared/contexts/UserContext";

interface ProfileData {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profilePic?: string;
  role?: string;
}

export default function ProfileScreen() {
  const { user, updateUser } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editedData, setEditedData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  // ✅ Fetch Profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/user/profile/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

      setProfile(data.user);
      setEditedData({
        name: data.user.name || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
      });
    } catch (error: any) {
      console.error("❌ Fetch error:", error);
      setMessage("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update text fields
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/user/profile/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setProfile(data.user);
      if (updateUser) updateUser({ ...user, ...data.user });
      setEditing(false);
      setMessage("✅ Profile updated successfully");
    } catch (error: any) {
      console.error("❌ Update failed:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // ✅ Handle image upload (Web)
  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setMessage("❌ Image too large (max 8MB)");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      setUploading(true);

      // ✅ Compress tighter for 5MB backend limit
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      await uploadProfilePic(compressed);
    } catch (err: any) {
      console.error("❌ Compression/Upload error:", err);
      setMessage("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Upload compressed image
  const uploadProfilePic = async (file: File) => {
    try {
      setUploading(true);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await fetch(
        `${API_BASE_URL}/api/user/profile/${user?.id}/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setProfile(data.user);
      updateUser({ ...user, profilePic: data.user.profilePic });
      setImageTimestamp(Date.now());
      setMessage("✅ Profile picture updated!");
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      setMessage(error.message);
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const getProfileImageUri = () => {
    if (!profile?.profilePic) return null;
    return `${profile.profilePic}?t=${imageTimestamp}`;
  };

  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Profile Picture */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {getProfileImageUri() ? (
            <Image
              key={imageTimestamp}
              source={{ uri: getProfileImageUri() as string }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {profile?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}

          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#FFF" />
            </View>
          )}

          {/* Camera Icon */}
          {typeof document !== "undefined" && (
            <label style={styles.cameraButton as any}>
              <View style={styles.cameraIconWrapper}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
                disabled={uploading}
              />
            </label>
          )}
        </View>

        <Text style={styles.userName}>{profile?.name}</Text>
        <Text style={styles.userEmail}>{profile?.email}</Text>
      </View>

      {/* Success/Error Message */}
      {message ? (
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.messageText,
              { color: message.startsWith("✅") ? "#4CAF50" : "#F44336" },
            ]}
          >
            {message}
          </Text>
        </View>
      ) : null}

      {/* Personal Information Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          {!editing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editedData.name}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, name: text })
                }
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editedData.phone}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, phone: text })
                }
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedData.address}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, address: text })
                }
                placeholder="Enter your address"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setEditing(false);
                  setEditedData({
                    name: profile?.name || "",
                    phone: profile?.phone || "",
                    address: profile?.address || "",
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Text style={styles.infoIcon}>📧</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Text style={styles.infoIcon}>📱</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {profile?.phone || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Text style={styles.infoIcon}>📍</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {profile?.address || "Not provided"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#007AFF",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    cursor: "pointer",
  },
  cameraIconWrapper: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraIcon: {
    fontSize: 18,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
  },
  messageContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
  },
  editButtonText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
  },
  infoList: {
    gap: 0,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "400",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  editForm: {
    gap: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#1A1A1A",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});