// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#F5F7FA',
        }
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="signup" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="forgotPassword" 
        options={{
          headerShown: false,
          title: 'Forgot Password',
        }}
      />
      <Stack.Screen 
        name="resetPassword" 
        options={{
          headerShown: false,
          title: 'Reset Password',
          // Allow this screen to receive URL parameters
          // This enables /resetPassword?token=abc123 to work
        }}
      />
    </Stack>
  );
}