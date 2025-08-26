import "./globals.css";
import { Orbitron } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer"; // Import the new Footer component

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "BxD Stats",
  description: "Estatísticas do servidor BxD",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          orbitron.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <div className="relative flex min-h-screen flex-col bg-gray-900">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
