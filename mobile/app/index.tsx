import { Button, Card, CollectionCard } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useCollections } from "@/context/CollectionsContext";
import { formatCurrency } from "@/utils/calculations";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { user, logout } = useAuth();
  const { collections } = useCollections();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = () => {
    setMenuVisible(false);
    logout();
    router.replace("/auth/login");
  };

  const totalAmount = collections.reduce((sum, col) => sum + col.totalAmount, 0);
  const activeCollections = collections.filter((col) => col.status === "active").length;

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* App Branding */}
        <View style={styles.brandingBar}>
          <Text style={styles.appTitle}>Pocketor</Text>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setMenuVisible(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back! 👋</Text>
            <Text style={styles.email}>{user?.name || user?.email}</Text>
          </View>
        </View>

        {/* Summary Stats - Using Card Component */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard} variant="elevated" padding={12}>
            <Text style={styles.statLabel}>Total Amount</Text>
            <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
          </Card>
          <Card style={styles.statCard} variant="elevated" padding={12}>
            <Text style={styles.statLabel}>Collections</Text>
            <Text style={styles.statValue}>{collections.length}</Text>
          </Card>
          <Card style={styles.statCard} variant="elevated" padding={12}>
            <Text style={styles.statLabel}>Active Collections</Text>
            <Text style={styles.statValue}>{activeCollections}</Text>
          </Card>
        </View>

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => router.push("/(tabs)/collection")}
          >
            <Text style={styles.quickAccessIcon}>💰</Text>
            <Text style={styles.quickAccessText}>Collection</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => router.push("/(tabs)/customer")}
          >
            <Text style={styles.quickAccessIcon}>👥</Text>
            <Text style={styles.quickAccessText}>Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => router.push("/(tabs)/loans")}
          >
            <Text style={styles.quickAccessIcon}>💼</Text>
            <Text style={styles.quickAccessText}>Loans</Text>
          </TouchableOpacity>
        </View>

        {/* Collections Section */}
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Collections</Text>
          <Button
            title="+ New"
            onPress={() => router.push("/collections/create")}
            variant="primary"
            size="small"
          />
        </View>

        {collections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No collections yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first collection to get started</Text>
            <Button
              title="Create Collection"
              onPress={() => router.push("/collections/create")}
              variant="primary"
              size="medium"
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          <View style={styles.collectionsList}>
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onPress={() => router.push(`/collections/${collection.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>

    {/* Menu Modal */}
    <Modal
      visible={menuVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setMenuVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.menuContainer}>
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/");
              }}
            >
              <Text style={styles.menuItemIcon}>🏠</Text>
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/collections/create");
              }}
            >
              <Text style={styles.menuItemIcon}>➕</Text>
              <Text style={styles.menuItemText}>Create Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemIcon}>⚙️</Text>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemIcon}>ℹ️</Text>
              <Text style={styles.menuItemText}>About</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  brandingBar: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  menuButton: {
    position: "absolute",
    right: 15,
    top: 20,
    padding: 5,
  },
  menuIcon: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  email: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 12,
  },
  quickAccessButton: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickAccessIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  section: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  createButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyStateButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  collectionsList: {
    gap: 10,
  },
  collectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collectionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  collectionName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  collectionInfo: {
    fontSize: 12,
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
  },
  statusInactive: {
    backgroundColor: "#FFEBEE",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  collectionCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  cardLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#007AFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 24,
    color: "#999",
    fontWeight: "bold",
  },
  userInfo: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 30,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#999",
  },
  menuItems: {
    padding: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
  },
  logoutMenuItem: {
    backgroundColor: "#FFEBEE",
  },
  logoutText: {
    color: "#FF3B30",
    fontWeight: "600",
  },
});
