import { useState } from "react";
import Input from "../shared/Input";
import Button from "../shared/Button";

export default function PasswordStep({ onSubmit }) {
    const [passwords, setPasswords] = useState({ password: "", confirm: "" });
    const match = passwords.password.length >= 8 && passwords.password === passwords.confirm;

    return (
        <div className="auth-card">
            <h2>Sign Up</h2>
            <Input label="Password*" type="password" value={passwords.password} onChange={(e) => setPasswords((prev) => ({ ...prev, password: e.target.value }))} />
            <Input label="Password Confirmation*" type="password" value={passwords.confirm} onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))} />
            <Button disabled={!match} onClick={() => onSubmit(passwords.password)}>Create account</Button>
        </div>
    );
}