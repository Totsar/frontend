import React from "react";

export default function Input({ label, type = "text", value, onChange, ...rest }) {
    return (
        <label className="input-group">
            <span>{label}</span>
            <input type={type} value={value} onChange={onChange} {...rest} />
        </label>
    );
}