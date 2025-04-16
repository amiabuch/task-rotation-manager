// src/auth/KindeAuth.js
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
// import { useEffect } from "react";
import { supabase } from '../supabase/client';

// Wrapper for Kinde auth that syncs with Supabase
export function KindeAuthProvider({ children }) {
  return (
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
      redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URI}
      logoutUri={import.meta.env.VITE_KINDE_LOGOUT_URI}
      onRedirectCallback={async (user) => {
        // Sync user with Supabase when they log in
        if (user) {
          try {
            // First check if user exists in Supabase
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            if (!existingUser) {
              // Create user in Supabase if they don't exist
              await supabase.from('users').insert({
                id: user.id,
                email: user.email,
                name: user.given_name ? `${user.given_name} ${user.family_name || ''}` : user.email,
                avatar_url: user.picture
              });
            }
          } catch (error) {
            console.error('Error syncing user with Supabase:', error);
          }
        }
      }}
    >
      {children}
    </KindeProvider>
  );
}

// Add Kinde hooks for easy access
export { useKindeAuth } from "@kinde-oss/kinde-auth-react";