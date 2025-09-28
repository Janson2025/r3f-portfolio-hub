// src/app/project/grid/interactions/DevRotatePanel.jsx
import React, { useEffect, useState } from "react";
import HudPanel from "../../../components/hud/HudPanel.jsx";
import HudSection from "../../../components/hud/HudSection.jsx";
import HudRow from "../../../components/hud/HudRow.jsx";

export default function DevRotatePanel({ gridRef }) {
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);

  // Re-check devAPI regularly so we rerender when the ref attaches
  useEffect(() => {
    const id = setInterval(() => {
      const api = gridRef.current?.devAPI;
      setConnected(!!api);
      setBusy(!!api?.busy?.());
    }, 120);
    return () => clearInterval(id);
  }, [gridRef]);

  const api = gridRef.current?.devAPI;
  const disabled = !connected || busy;

  return (
    <HudPanel title="Grid Rotations" positionClass="fixed top-28 right-4">
      {/* X Axis */}
      <HudSection heading="X Axis (Left / Mid / Right)">
        <HudRow name="Left" align="right" disabled={disabled} onCw={() => api?.x_left(+1)}  onCcw={() => api?.x_left(-1)} />
        <HudRow name="Mid"  align="right" disabled={disabled} onCw={() => api?.x_mid(+1)}   onCcw={() => api?.x_mid(-1)} />
        <HudRow name="Right" align="right" disabled={disabled} onCw={() => api?.x_right(+1)} onCcw={() => api?.x_right(-1)} />
      </HudSection>

      {/* Y Axis */}
      <HudSection heading="Y Axis (Front / Mid / Back)">
        <HudRow name="Front" align="right" disabled={disabled} onCw={() => api?.y_front(+1)} onCcw={() => api?.y_front(-1)} />
        <HudRow name="Mid" align="right" disabled={disabled} onCw={() => api?.y_mid(+1)}   onCcw={() => api?.y_mid(-1)} />
        <HudRow name="Back" align="right" disabled={disabled} onCw={() => api?.y_back(+1)}  onCcw={() => api?.y_back(-1)} />
      </HudSection>

      {/* Z Axis */}
      <HudSection heading="Z Axis (Bottom / Mid / Top)" divider={false}>
        <HudRow name="Bottom" align="right" disabled={disabled} onCw={() => api?.z_bottom(+1)} onCcw={() => api?.z_bottom(-1)} />
        <HudRow name="Mid" align="right" disabled={disabled} onCw={() => api?.z_mid(+1)}    onCcw={() => api?.z_mid(-1)} />
        <HudRow name="Top" align="right" disabled={disabled} onCw={() => api?.z_top(+1)}    onCcw={() => api?.z_top(-1)} />
      </HudSection>

      <div className="mt-2 text-[11px] text-white/70">
        {connected ? (busy ? "Status: Rotating…" : "Status: Connected (Idle)") : "Status: Disconnected"}
      </div>
    </HudPanel>
  );
}
