import { useEffect } from "react";
import { authService } from "@/api";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    google: any;
  }
}

export const GoogleOneTap = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Check if Google script is loaded or user is already authenticated (via context or token in storage)
    if (!window.google || user || localStorage.getItem("token")) return;

    const initOneTap = async () => {
      try {
        const VITE_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!VITE_GOOGLE_CLIENT_ID) {
          console.warn("Google Client ID not found. One Tap disabled.");
          return;
        }

        window.google.accounts.id.initialize({
          client_id: VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          context: "signin",
          ux_mode: "popup",
          auto_select: true,
          itp_support: true,
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log(
              "One Tap skipped/not displayed:",
              notification.getNotDisplayedReason()
            );
          }
        });
      } catch (error) {
        console.error("One Tap initialization error:", error);
      }
    };

    initOneTap();

    return () => {
      // Cleanup: Cancel the One Tap prompt if component unmounts
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  const handleCredentialResponse = (response: any) => {
    console.log("Encoded JWT ID token: " + response.credential);
    verifyGoogleToken(response.credential);
  };

  const verifyGoogleToken = async (token: string) => {
    try {
      const data = await authService.verifyGoogleOneTap(token);
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e) {
      console.error("One Tap login failed", e);
    }
  };

  return null; // One Tap is an overlay
};
