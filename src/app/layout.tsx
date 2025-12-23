import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthHashHandler } from "@/components/AuthHashHandler";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Writine - AI Blog Writing Platform | Create SEO-Optimized Content",
  description: "Writine is the #1 AI-powered blog writing platform. Create SEO-optimized articles, blog posts, and content in minutes. Free AI writer with built-in SEO tools, content optimization, and publishing features.",
  keywords: [
    // Core Keywords
    "AI blog writer", "AI content writer", "AI writing tool", "AI article writer", "AI blog generator",
    "AI content generator", "AI copywriter", "AI text generator", "AI writing assistant", "AI content creator",
    "blog writing AI", "content writing AI", "article writing AI", "automated blog writing", "smart blog writer",
    
    // SEO Keywords
    "SEO content writer", "SEO blog writer", "SEO article generator", "SEO optimized content", "SEO writing tool",
    "SEO content generator", "SEO friendly articles", "search engine optimization", "keyword optimization",
    "meta description generator", "title tag generator", "SEO content optimization", "rank higher on Google",
    
    // Blog Keywords
    "blog post generator", "blog content creator", "blog article writer", "professional blog writing",
    "blog writing software", "blog automation", "blog publishing platform", "blog management tool",
    "blogging platform", "blogging tool", "blog creator", "blog maker", "instant blog posts",
    
    // Content Marketing
    "content marketing tool", "content strategy", "content creation platform", "content automation",
    "marketing content writer", "digital content creator", "brand content writer", "content marketing AI",
    "inbound marketing content", "content marketing software", "marketing automation", "lead generation content",
    
    // Writing Tools
    "online writing tool", "writing software", "writing platform", "professional writing tool",
    "creative writing AI", "business writing tool", "technical writing AI", "copywriting tool",
    "content writing software", "writing assistant", "grammar checker", "writing editor",
    
    // Business & Startup
    "startup content tool", "business blog writer", "enterprise content platform", "SaaS content writer",
    "small business blog", "company blog generator", "corporate content creator", "B2B content writer",
    "B2C content marketing", "ecommerce content", "product description writer", "landing page copy",
    
    // Free & Pricing
    "free AI writer", "free blog generator", "free content writer", "free SEO tool", "affordable AI writer",
    "cheap content writer", "budget blog tool", "free trial AI writer", "no cost blog generator",
    
    // Features
    "auto blog writer", "one-click blog", "instant articles", "quick content creation", "fast blog posts",
    "bulk content generator", "multiple article writer", "batch content creation", "content at scale",
    "long form content", "short form content", "social media content", "email content writer",
    
    // Industry Specific
    "tech blog writer", "health blog writer", "finance blog writer", "travel blog writer",
    "food blog writer", "lifestyle blog writer", "fashion blog writer", "sports blog writer",
    "education blog writer", "real estate content", "legal content writer", "medical content writer",
    
    // Comparisons
    "ChatGPT alternative", "Jasper alternative", "Copy.ai alternative", "Writesonic alternative",
    "better than ChatGPT", "best AI writer 2024", "top AI writing tool", "AI writer comparison",
    
    // Actions
    "create blog post", "write article online", "generate content", "publish blog", "write SEO content",
    "create website content", "make blog post", "build content strategy", "improve SEO ranking",
    
    // Long-tail Keywords
    "how to write blog posts faster", "AI tool for blog writing", "best AI for content creation",
    "automated content writing software", "AI powered blog platform", "machine learning content writer",
    "natural language content generator", "GPT blog writer", "Claude AI writer", "Anthropic AI writing",
    
    // Platform
    "web based writing tool", "cloud content platform", "online blog editor", "browser based writer",
    "no download AI writer", "SaaS writing platform", "content management system", "headless CMS",
    
    // Quality
    "high quality content", "premium blog posts", "professional articles", "human-like writing",
    "engaging content", "original content", "plagiarism free", "unique articles", "quality blog posts",
    
    // Publishing
    "publish anywhere", "multi-platform publishing", "WordPress integration", "Medium publishing",
    "custom domain blog", "white label blog", "branded content platform", "content distribution",
    
    // Analytics
    "content analytics", "SEO analytics", "blog performance", "content metrics", "traffic analysis",
    "keyword tracking", "rank tracking", "content ROI", "engagement metrics",
    
    // Collaboration
    "team content platform", "collaborative writing", "content team tool", "agency content tool",
    "freelancer writing tool", "remote content creation", "shared content workspace",
    
    // Languages
    "English content writer", "multilingual blog", "translate content", "global content platform",
    "international blog writer", "localized content", "multi-language SEO",
    
    // Use Cases
    "affiliate marketing content", "review articles", "how-to guides", "listicles generator",
    "tutorial writer", "case study writer", "white paper generator", "ebook content",
    "newsletter content", "press release writer", "announcement posts", "update articles",
    
    // Technology
    "GPT-4 writer", "latest AI technology", "advanced AI writing", "neural network content",
    "deep learning writer", "state of the art AI", "next gen content tool", "future of writing",
    
    // Results
    "increase traffic", "boost SEO", "grow audience", "more readers", "higher rankings",
    "better engagement", "convert visitors", "build authority", "establish expertise",
    
    // Time Saving
    "save time writing", "quick blog creation", "efficient content", "productivity tool",
    "time saving AI", "fast article generation", "instant content", "rapid publishing",
    
    // Writine Specific
    "Writine", "Writine AI", "Writine blog", "Writine platform", "Writine writer",
    "writine.com", "Writine content", "Writine SEO", "Writine publishing", "Writine app"
  ],
  authors: [{ name: "Writine", url: "https://writine.com" }],
  creator: "Writine",
  publisher: "Writine",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Writine - AI Blog Writing Platform | Create SEO-Optimized Content",
    description: "Create SEO-optimized blog posts in minutes with Writine AI. The smartest way to write, optimize, and publish content that ranks.",
    url: "https://writine.com",
    siteName: "Writine",
    images: [
      {
        url: "https://writine.com/OG.png",
        width: 1200,
        height: 630,
        alt: "Writine - AI Blog Writing Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Writine - AI Blog Writing Platform",
    description: "Create SEO-optimized blog posts in minutes with Writine AI. The smartest way to write, optimize, and publish content.",
    images: ["https://writine.com/OG.png"],
    creator: "@writine",
    site: "@writine",
  },
  alternates: {
    canonical: "https://writine.com",
  },
  category: "Technology",
  classification: "AI Writing Tool",
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AuthHashHandler />
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
