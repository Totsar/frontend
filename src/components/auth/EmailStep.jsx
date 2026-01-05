import Input from "../shared/Input";
import Button from "../shared/Button";

export default function EmailStep({ formData, onChange, onNext }) {
    const isValid = /\S+@\S+\.\S+/.test(formData.email);
    return (
        <div className="auth-card">
            <h2>Sign Up</h2>
            <Input
                label="Email*"
                type="email"
                value={formData.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="name@example.com"
            />
            <p className="helper-text">A code will be sent to your email.</p>
            <Button disabled={!isValid} onClick={onNext}>Send code</Button>
        </div>
    );
}