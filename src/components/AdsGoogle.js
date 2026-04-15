"use client";

import { useEffect } from "react";

const AdsGoogle = ({ slot, style = {}, className = "", format = "auto", responsive = "true" }) => {
    useEffect(() => {
        if (window) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                // Handle error silently
            }
        }
    }, []);

    return (
        <ins
            className={`adsbygoogle ${className}`}
            style={style}
            data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive}
        ></ins>
    );
};

export default AdsGoogle;
