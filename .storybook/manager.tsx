import React, { useCallback, useEffect, useRef, useState } from "react";
import { addons, types } from "@storybook/manager-api";

const ADDON_ID = "iztro/ai-code";
const PANEL_ID = `${ADDON_ID}/panel`;
const EVENT_ID = "iztro/ai-code/data";
const REQUEST_ID = "iztro/ai-code/request";

const AiCodePanel: React.FC = () => {
  const [data, setData] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const channel = addons.getChannel();
    const handler = (payload: unknown) => setData(payload);
    channel.on(EVENT_ID, handler);
    channel.emit(REQUEST_ID);
    return () => {
      channel.off(EVENT_ID, handler);
    };
  }, []);

  const jsonStr = data ? JSON.stringify(data, null, 2) : "";

  const handleCopy = useCallback(() => {
    if (!jsonStr) return;
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [jsonStr]);

  if (!data) {
    return (
      <div style={{ padding: 16, color: "#888", fontSize: 13 }}>
        等待命盘数据...请在左侧 Controls 中输入生日信息。
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          命盘 JSON（可直接复制给 AI 分析）
        </span>
        <button
          onClick={handleCopy}
          style={{
            marginLeft: "auto",
            padding: "4px 12px",
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
            background: copied ? "#52c41a" : "#fff",
            color: copied ? "#fff" : "#333",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {copied ? "已复制 ✓" : "复制 JSON"}
        </button>
      </div>
      <pre
        style={{
          flex: 1,
          margin: 0,
          padding: 16,
          overflow: "auto",
          fontSize: 12,
          lineHeight: 1.5,
          fontFamily: "'SF Mono', 'Menlo', 'Monaco', monospace",
          background: "#fafafa",
        }}
      >
        {jsonStr}
      </pre>
    </div>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: "Ai Code",
    render: ({ active }) => (active ? <AiCodePanel /> : null),
  });
});
