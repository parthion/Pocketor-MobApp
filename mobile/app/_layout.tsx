import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CollectionsProvider } from "@/context/CollectionsContext";
import { LoanCollectionProvider } from "@/context/LoanCollectionContext";
import { Stack } from "expo-router";
import { Platform } from "react-native";

// Import web-specific CSS to hide Expo dev navigation
if (Platform.OS === 'web') {
  require('./_layout.web.css');
}

function RootLayoutNav() {
  const { isLoggedIn } = useAuth();

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
          <Stack.Screen
            name="collections/[id]"
            options={{
              title: "Collection Details",
              headerShown: true,
            }}
          />
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
