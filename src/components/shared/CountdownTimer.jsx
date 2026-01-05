import { useEffect } from "react";

export default function CountdownTimer({ seconds, onExpire }) {
    useEffect(() => {
        if (seconds === 0) return onExpire?.();
        const id = setTimeout(() => onExpire?.(seconds - 1), 1000);
        return () => clearTimeout(id);
    }, [seconds, onExpire]);
    return <span>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span>;
}