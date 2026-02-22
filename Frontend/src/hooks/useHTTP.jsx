import { useState } from "react";

export default function useHTTP() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);   

    async function sendRequest(requestFunction, ...args) {
        setLoading(true);
        setError(null);
        try {
            const response = await requestFunction(...args);
            return response;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { loading, error, sendRequest };
}