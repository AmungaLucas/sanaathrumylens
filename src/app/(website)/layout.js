// src/app/(website)/layout.js (website layout)
import Header from '../../components/layout/Header';


export default function WebLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-0 py-0 sm:px-2 sm:py-0">
                {children}
            </main>

            {/* <Footer /> */}
        </div>
    );
}
