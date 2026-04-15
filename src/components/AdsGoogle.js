"use client";

import { useEffect } from "react";

const AD_CLIENT = "ca-pub-8031704055036556";

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
            data-ad-client={AD_CLIENT}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive}
        ></ins>
    );
};

export default AdsGoogle;
