// src/pages/AuthPage.jsx
import { useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const AuthPage = () => {
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [step, setStep] = useState(1);       // 1=email, 2=otp, 3=info

    // Login form
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    // Register form
    const [registerEmail, setRegisterEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [registerData, setRegisterData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setStep(1);
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        // TODO: connect to API
        console.log("Login:", loginData);
    };

    const handleRegisterEmailSubmit = (e) => {
        e.preventDefault();
        // TODO: send OTP
        if (!registerEmail.trim()) return;
        setStep(2);
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        // TODO: verify OTP
        if (otp.length !== 6) return;
        setStep(3);
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        // TODO: send register data
        console.log("Register:", { registerEmail, otp, ...registerData });
    };

    return (
        <div className="page">
            <Header />

            <main className="page-content">
                <div className="container auth-container">
                    <div className="auth-card">
                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                                onClick={() => switchMode("login")}
                            >
                                Log in
                            </button>
                            <button
                                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                                onClick={() => switchMode("register")}
                            >
                                Register
                            </button>
                        </div>

                        {mode === "login" && (
                            <form className="auth-form" onSubmit={handleLoginSubmit}>
                                <h2>Welcome back</h2>
                                <p className="muted">Please log in to your account.</p>

                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={loginData.email}
                                    onChange={(e) =>
                                        setLoginData({ ...loginData, email: e.target.value })
                                    }
                                    required
                                />

                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Your password"
                                    value={loginData.password}
                                    onChange={(e) =>
                                        setLoginData({ ...loginData, password: e.target.value })
                                    }
                                    required
                                />

                                <button className="btn primary" type="submit">
                                    Log in
                                </button>
                            </form>
                        )}

                        {mode === "register" && (
                            <>
                                {step === 1 && (
                                    <form className="auth-form" onSubmit={handleRegisterEmailSubmit}>
                                        <h2>Create your account</h2>
                                        <p className="muted">Enter your email to receive an OTP.</p>

                                        <label>Email</label>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={registerEmail}
                                            onChange={(e) => setRegisterEmail(e.target.value)}
                                            required
                                        />

                                        <button className="btn primary" type="submit">
                                            Send OTP
                                        </button>
                                    </form>
                                )}

                                {step === 2 && (
                                    <form className="auth-form" onSubmit={handleOtpSubmit}>
                                        <h2>Verify OTP</h2>
                                        <p className="muted">Enter the 6‑character code sent to your email.</p>

                                        <label>OTP Code</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="6‑digit code"
                                            value={otp}
                                            onChange={(e) =>
                                                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                                            }
                                            maxLength={6}
                                            required
                                        />

                                        <div className="auth-row">
                                            <button
                                                className="btn ghost"
                                                type="button"
                                                onClick={() => setStep(1)}
                                            >
                                                Back
                                            </button>
                                            <button className="btn primary" type="submit">
                                                Verify
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {step === 3 && (
                                    <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                        <h2>Complete your profile</h2>
                                        <p className="muted">Fill in your details to finish registration.</p>

                                        <div className="grid-2">
                                            <div>
                                                <label>First name</label>
                                                <input
                                                    type="text"
                                                    placeholder="John"
                                                    value={registerData.firstName}
                                                    onChange={(e) =>
                                                        setRegisterData({ ...registerData, firstName: e.target.value })
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label>Last name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Doe"
                                                    value={registerData.lastName}
                                                    onChange={(e) =>
                                                        setRegisterData({ ...registerData, lastName: e.target.value })
                                                    }
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="+1 555 123 4567"
                                            value={registerData.phone}
                                            onChange={(e) =>
                                                setRegisterData({ ...registerData, phone: e.target.value })
                                            }
                                            required
                                        />

                                        <label>Password</label>
                                        <input
                                            type="password"
                                            placeholder="Create a password"
                                            value={registerData.password}
                                            onChange={(e) =>
                                                setRegisterData({ ...registerData, password: e.target.value })
                                            }
                                            required
                                        />

                                        <label>Confirm password</label>
                                        <input
                                            type="password"
                                            placeholder="Repeat your password"
                                            value={registerData.confirmPassword}
                                            onChange={(e) =>
                                                setRegisterData({
                                                    ...registerData,
                                                    confirmPassword: e.target.value,
                                                })
                                            }
                                            required
                                        />

                                        <div className="auth-row">
                                            <button
                                                className="btn ghost"
                                                type="button"
                                                onClick={() => setStep(2)}
                                            >
                                                Back
                                            </button>
                                            <button className="btn primary" type="submit">
                                                Register
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AuthPage;
