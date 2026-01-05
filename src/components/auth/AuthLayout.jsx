import { useState } from "react";
import EmailStep from "./EmailStep";
import OtpStep from "./OtpStep";
import InfoStep from "./InfoStep";
import PasswordStep from "./PasswordStep";
import LoginForm from "./LoginForm";

const STEPS = ["email", "otp", "info", "password"];

export default function AuthLayout() {
    const [mode, setMode] = useState(null); // null | "signup" | "login"
    const [step, setStep] = useState("email");
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
    });
    const [otp, setOtp] = useState(new Array(6).fill(""));

    const updateForm = (updates) => setFormData((prev) => ({ ...prev, ...updates }));

    const renderStep = () => {
        switch (step) {
            case "email":
                return (
                    <EmailStep
                        formData={formData}
                        onChange={updateForm}
                        onNext={() => setStep("otp")}
                    />
                );
            case "otp":
                return (
                    <OtpStep
                        otp={otp}
                        onChange={(index, value) => setOtp((prev) => prev.map((digit, idx) => (idx === index ? value : digit)))}
                        onNext={() => setStep("info")}
                    />
                );
            case "info":
                return <InfoStep formData={formData} onChange={updateForm} onNext={() => setStep("password")} />;
            case "password":
                return <PasswordStep onSubmit={(password) => console.log("Create account payload", { ...formData, password })} />;
            default:
                return null;
        }
    };

    if (!mode) {
        return (
            <div className="auth-shell">
                <header className="auth-header">
                    <h1>Sign up / Login</h1>
                    <p className="subheading">Choose how you’d like to continue</p>
                </header>

                <div className="selection-card">
                    <button className="btn btn-primary" onClick={() => setMode("signup")}>
                        Continue to Sign up
                    </button>
                    <button className="btn btn-secondary" onClick={() => setMode("login")}>
                        Continue to Login
                    </button>
                </div>
            </div>
        );
    }
    if (mode === "signup") {
        return (
            <div className="auth-shell">
                <button className="text-button" onClick={() => { setMode(null); setStep("email"); }}>
                    ← Back
                </button>

                <header className="auth-header">...</header>

                <div className="auth-panels">
                    {renderStep()}
                    {/*<LoginForm />*/}
                </div>
            </div>
        );
    }
    if (mode === "login") {
        return (
            <div className="auth-shell">
                <button className="text-button" onClick={() => setMode(null)}>← Back</button>

                <div className="login-only-card auth-card">
                    <LoginForm />
                </div>
            </div>
        );
    }


}