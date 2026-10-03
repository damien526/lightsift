import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/site';

export const dynamic = 'force-static';
export const alt = `${SITE_NAME}: cull thousands of photos in your browser`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0c0b09',
          color: '#ece7dd',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              width: 28,
              height: 28,
              borderRadius: 999,
              background: '#f2a33c',
            }}
          />
          <div style={{ display: 'flex', fontSize: 40, color: '#ece7dd' }}>OnlineCull</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 44,
            fontSize: 82,
            lineHeight: 1.06,
          }}
        >
          <span>Cull a whole shoot</span>
          <span style={{ color: '#f2a33c', fontStyle: 'italic' }}>before your coffee cools.</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 48,
            fontSize: 28,
            color: '#9b948a',
            fontFamily: 'sans-serif',
          }}
        >
          Free RAW culling in the browser · no upload · no install · no account
        </div>
      </div>
    ),
    size,
  );
}
