import { useCallback, useEffect, useState } from "react";

export function useOtpTimer(initial = 300) {
    const [seconds, setSeconds] = useState(initial);
    useEffect(() => {
        if (!seconds) return;
        const id = setInterval(() => setSeconds((prev) => prev - 1), 1000);
        return () => clearInterval(id);
    }, [seconds]);
    const reset = useCallback(() => setSeconds(initial), [initial]);
    return { seconds, reset };
}