import Button from "../shared/Button";
import { useOtpTimer } from "../../hooks/useOtpTimer";
import CountdownTimer from "../shared/CountdownTimer";

export default function OtpStep({ otp, onChange, onNext }) {
    const { seconds, reset } = useOtpTimer(300);
    const isComplete = otp.every((digit) => digit !== "");

    return (
        <div className="auth-card">
            <h2>Verification</h2>
            <p>Enter the code sent to your email.</p>
            <CountdownTimer seconds={seconds} onExpire={() => {}} />
            <div className="otp-boxes">
                {otp.map((digit, idx) => (
                    <input
                        key={idx}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => onChange(idx, e.target.value.replace(/\D/, ""))}
                    />
                ))}
            </div>
            <Button disabled={!isComplete} onClick={onNext}>Verify code</Button>
            <button className="text-button" disabled={seconds > 0} onClick={reset}>
                Resend
            </button>
        </div>
    );
}