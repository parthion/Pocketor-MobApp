import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CollectionsProvider } from "@/context/CollectionsContext";
import { Stack } from "expo-router";

function RootLayoutNav() {
  const { isLoggedIn } = useAuth();

  return (
    <Stack>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="index" options={{ headerShown: false }} />
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
        <RootLayoutNav />
      </CollectionsProvider>
    </AuthProvider>
  );
}
