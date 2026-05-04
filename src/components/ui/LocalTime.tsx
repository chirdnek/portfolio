"use client";

import { useEffect, useState } from "react";

export default function LocalTime({
  timeZone = "Asia/Manila",
  label = "ZAM",
}: {
  timeZone?: string;
  label?: string;
}) {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return (
    <span className="mono-label tabular-nums" suppressHydrationWarning>
      {label} {now || "--:--:--"}
    </span>
  );
}
