import { useEffect, useRef } from "react";

// This will only work on https or localhost
const useWakeLock = () => {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    console.log("Entering Wake Lock");
    const requestLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          console.log("Wake lock active");

          // Re-acquire if phone minimizes and comes back
          wakeLockRef.current.addEventListener("release", () => {
            console.log("Wake lock released");
          });
        }
      } catch (err) {
        console.error("WakeLock error:", err);
      }
    };

    requestLock();

    // Cleanup on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);
}
export default useWakeLock;
