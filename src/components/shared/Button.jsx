export default function Button({ children, disabled, variant = "primary", ...rest }) {
    return (
        <button className={`btn btn-${variant}`} disabled={disabled} {...rest}>
            {children}
        </button>
    );
}