import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 't3n — منصة تسليم ذاتي للتراخيص والمنتجات';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #05111d 0%, #091a2a 47%, #062218 100%)',
          color: '#f8fafc',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 760,
            height: 760,
            right: -250,
            top: -310,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.32) 0%, rgba(16, 185, 129, 0.10) 36%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 560,
            height: 560,
            left: -230,
            bottom: -300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.13,
            backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.25) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div style={{ display: 'flex', width: '100%', padding: '62px 72px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 66,
                  height: 66,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #34d399, #10b981)',
                  boxShadow: '0 18px 40px rgba(16, 185, 129, 0.32)',
                  color: '#042f2e',
                  fontWeight: 900,
                  fontSize: 28,
                }}
              >
                T3
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: 5, color: '#f8fafc' }}>T3N</div>
                <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2.5, color: '#86efac' }}>SELF-SERVICE PLATFORM</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6ee7b7', fontSize: 18, fontWeight: 800, letterSpacing: 1.5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: '#34d399', display: 'flex' }} />
                ALL-IN-ONE SELF-SERVICE PORTAL
              </div>
              <div style={{ display: 'flex', width: 690, fontSize: 48, lineHeight: 1.14, fontWeight: 900, letterSpacing: -1.4, direction: 'ltr', textAlign: 'left' }}>
                Licenses, keys & downloads
              </div>
              <div style={{ display: 'flex', fontSize: 22, lineHeight: 1.5, color: '#cbd5e1', direction: 'ltr', textAlign: 'left' }}>
                Keys, guides and support in one secure place.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {['Licenses', 'Downloads', 'Support'].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '11px 17px',
                    borderRadius: 13,
                    border: '1px solid rgba(167, 243, 208, 0.24)',
                    background: 'rgba(15, 23, 42, 0.54)',
                    color: '#d1fae5',
                    fontSize: 17,
                    fontWeight: 700,
                    direction: 'ltr',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', width: 274, marginLeft: 58, alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                width: 250,
                height: 318,
                padding: 22,
                borderRadius: 30,
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(167, 243, 208, 0.25)',
                background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.20), rgba(15, 23, 42, 0.68))',
                boxShadow: '0 26px 64px rgba(0, 0, 0, 0.32)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', width: 40, height: 40, borderRadius: 12, background: 'rgba(110, 231, 183, 0.14)', border: '1px solid rgba(110, 231, 183, 0.26)' }} />
                <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 99, background: '#34d399', boxShadow: '0 0 18px rgba(52, 211, 153, 0.9)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 11, width: 136, borderRadius: 99, background: 'rgba(226, 232, 240, 0.90)' }} />
                <div style={{ height: 8, width: 182, borderRadius: 99, background: 'rgba(148, 163, 184, 0.42)' }} />
                <div style={{ height: 8, width: 116, borderRadius: 99, background: 'rgba(148, 163, 184, 0.28)' }} />
              </div>
              <div style={{ display: 'flex', height: 48, borderRadius: 13, background: '#34d399', color: '#042f2e', justifyContent: 'center', alignItems: 'center', fontSize: 16, fontWeight: 900 }}>
                t3nn.wtf
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
