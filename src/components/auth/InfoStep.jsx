import Input from "../shared/Input";
import Button from "../shared/Button";

export default function InfoStep({ formData, onChange, onNext }) {
    const fields = ["name", "phone", "dateOfBirth", "gender"];
    const allFilled = fields.every((field) => formData[field]);

    return (
        <div className="auth-card">
            <h2>Sign Up</h2>
            <Input label="Name*" value={formData.name} onChange={(e) => onChange({ name: e.target.value })} />
            <Input label="Phone no.*" value={formData.phone} onChange={(e) => onChange({ phone: e.target.value })} />
            <Input label="Email*" value={formData.email} disabled />
            <Input label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(e) => onChange({ dateOfBirth: e.target.value })} />
            <select value={formData.gender} onChange={(e) => onChange({ gender: e.target.value })}>
                <option value="">Gender*</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>
            <Button disabled={!allFilled} onClick={onNext}>Next</Button>
        </div>
    );
}