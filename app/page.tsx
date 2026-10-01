import { CullApp } from '@/components/CullApp';
import { HOME_FAQ } from '@/lib/faq';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export default function Home() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web browser',
      description: SITE_DESCRIPTION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Open folders of RAW photos locally, no upload',
        'CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2, PEF, JPEG support',
        'Keyboard-first rating, picks and rejects',
        '1:1 loupe with EXIF and histogram',
        'XMP sidecar export for Lightroom, Bridge and Capture One',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQ.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CullApp />
    </>
  );
}
