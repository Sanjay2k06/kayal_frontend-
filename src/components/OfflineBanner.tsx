import { useEffect, useState } from "react";

const OfflineBanner = () => {
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
      You are offline. Some features may not work until your connection is restored.
    </div>
  );
};

export default OfflineBanner;