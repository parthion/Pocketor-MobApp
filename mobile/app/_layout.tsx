import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CollectionsProvider } from "@/context/CollectionsContext";
import { LoanCollectionProvider } from "@/context/LoanCollectionContext";
import { Stack } from "expo-router";
import { ActivityIndicator, Platform, View } from "react-native";

// Import web-specific CSS to hide Expo dev navigation
if (Platform.OS === 'web') {
  require('./_layout.web.css');
}

function RootLayoutNav() {
  const { isLoggedIn, isLoading } = useAuth();

  // Wait for auth check to complete before rendering any screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="collections/create"
            options={{
              title: "Create Collection",
              headerShown: true,
            }}
          />
          <Stack.Screen name="collections/[id]" options={{ title: 'Collection Details', headerShown: true }} />
          <Stack.Screen name="customer-detail/[id]" options={{ title: 'Customer Detail', headerShown: false }} />
          <Stack.Screen name="loan-detail/[id]" options={{ title: 'Loan Detail', headerShown: false }} />
          <Stack.Screen name="daily-collection" options={{ title: 'Daily Collection', headerShown: false }} />
        </>
      ) : (
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
          }}
        />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CollectionsProvider>
        <LoanCollectionProvider>
          <RootLayoutNav />
        </LoanCollectionProvider>
      </CollectionsProvider>
    </AuthProvider>
  );
}
