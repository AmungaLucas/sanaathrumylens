// src/app/layout.js (RootLayout)
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "./seo/constants";


export const metadata = {
    metadataBase: new URL(SITE_URL),

    title: {
        default: SITE_NAME,
        template: "%s | " + SITE_NAME,
    },

    description: DEFAULT_DESCRIPTION,

    robots: {
        index: true,
        follow: true,
    },

    openGraph: {
        type: "website",
        siteName: SITE_NAME,
        title: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        images: [
            {
                url: DEFAULT_OG_IMAGE,
                width: 1200,
                height: 630,
                alt: SITE_NAME,
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        images: [DEFAULT_OG_IMAGE],
        creator: TWITTER_HANDLE,
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                {/* Google AdSense Script */}
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8031704055036556"
                    crossOrigin="anonymous"
                ></script>
                <meta name="google-adsense-account" content="ca-pub-8031704055036556" />
            </head>
            <body>
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: { background: "#363636", color: "#fff", marginTop: "80px" },
                            success: { duration: 3000, theme: { primary: "green", secondary: "black" } },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
