import { useState } from "react";
import Input from "../shared/Input";
import Button from "../shared/Button";

export default function LoginForm({ onLogin }) {
    const [values, setValues] = useState({ email: "", password: "" });
    const ready = /\S+@\S+\.\S+/.test(values.email) && values.password.length >= 8;

    return (
        <div className="auth-card">
            <h2>Login</h2>
            <Input label="Email*" type="email" value={values.email} onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))} />
            <Input label="Password*" type="password" value={values.password} onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))} />
            <Button disabled={!ready} onClick={() => onLogin(values)}>Login</Button>
            <button className="text-button">Forgot your password?</button>
        </div>
    );
}