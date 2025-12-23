'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f3] bg-grid flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 left-0 right-0 z-50 bg-[#f8f7f3]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8345dd] rounded-lg flex items-center justify-center">
              <Image src="/writine-light.svg" alt="Writine" width={20} height={20} />
            </div>
            <span className="font-semibold text-lg">Writine</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: December 23, 2025</p>

        <div className="prose prose-slate max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Writine. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy explains how we collect, use, and safeguard your information when you use our service.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li><strong>Account Information:</strong> Email address, name, and profile picture when you create an account</li>
            <li><strong>Content:</strong> Blog posts, articles, and other content you create using our platform</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our service</li>
            <li><strong>Payment Information:</strong> Billing details processed securely through our payment provider</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Analyze usage patterns to improve user experience</li>
          </ul>

          <h2>4. AI-Generated Content</h2>
          <p>
            Our service uses artificial intelligence to help generate blog content. The prompts and content you create 
            may be processed by our AI systems. We do not use your content to train AI models without your explicit consent.
          </p>

          <h2>5. Data Storage and Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against 
            unauthorized access, alteration, disclosure, or destruction. Your data is stored securely using 
            industry-standard encryption.
          </p>

          <h2>6. Third-Party Services</h2>
          <p>We may use third-party services that collect, monitor, and analyze data, including:</p>
          <ul>
            <li>Authentication providers (Google, GitHub)</li>
            <li>Payment processors</li>
            <li>Analytics services</li>
            <li>Cloud hosting providers</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Export your data in a portable format</li>
          </ul>

          <h2>8. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our service and hold certain information. 
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>

          <h2>9. Children&apos;s Privacy</h2>
          <p>
            Our service is not intended for use by children under the age of 13. We do not knowingly collect 
            personal information from children under 13.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting 
            the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please{' '}
            <Link href="/contact" className="text-[#8345dd] hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
