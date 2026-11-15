"use client";

import { useState } from "react";

type PasswordFieldProps = {
  name: string;
  label: string;
  minLength?: number;
};

export function PasswordField({ name, label, minLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          minLength={minLength}
          required
          autoComplete={name === "password" ? "current-password" : "new-password"}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ficha nenosiri" : "Onyesha nenosiri"}
          aria-pressed={visible}
          title={visible ? "Ficha nenosiri" : "Onyesha nenosiri"}
          style={{
            width: 44,
            minWidth: 44,
            maxWidth: 44,
            height: 44,
            minHeight: 44,
            flex: "0 0 44px",
            padding: 0,
            marginTop: 0,
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            background: "white",
            color: "#10233f",
            cursor: "pointer",
            fontSize: 19,
          }}
        >
          {visible ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}
