"use client";
import { useRouter } from 'next/navigation';
import { DiaryEntry } from '@/utils/store';
import PostPlayer from './PostPlayer';

export default function DiaryCover({ entry, isPreview = false, children }: { entry: DiaryEntry, isPreview?: boolean, children?: React.ReactNode }) {
  const router = useRouter();

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1.3', // Highly responsive GoodNotes proportion
        backgroundColor: '#FFF9C4', 
        backgroundImage: 'url("/assets/cloud_v4.png")',
        backgroundSize: '40%', // Scales cloud pattern with cover
        backgroundRepeat: 'repeat',
        backgroundBlendMode: 'overlay',
        borderRadius: '2% 8% 8% 2%',
        boxShadow: '-4px 6px 15px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        cursor: isPreview ? 'default' : 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        padding: '8% 8% 8% 12%'
      }}
      onClick={() => {
        if (!isPreview) alert(`[${entry.title}] 일기를 열었습니다! 📖 (MVP 버전)`);
      }}
      onMouseEnter={(e) => { if (!isPreview) e.currentTarget.style.transform = 'translateY(-5px)' }}
      onMouseLeave={(e) => { if (!isPreview) e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Binder Spine */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0, width: '8%',
        background: 'linear-gradient(to right, #B0BEC5, #ECEFF1 20%, #FFFFFF 50%, #ECEFF1 80%, #B0BEC5)',
        borderRight: '1px solid #90A4AE',
        zIndex: 10
      }}>
        {/* Binder Rings */}
        {[10, 30, 50, 70, 90].map(top => (
          <div key={top} style={{
            position: 'absolute',
            top: `${top}%`,
            left: '30%',
            width: '80%',
            height: '4%',
            background: 'linear-gradient(to bottom, #757575, #BDBDBD)',
            borderRadius: '4px',
            boxShadow: '1px 3px 6px rgba(0,0,0,0.4)',
            zIndex: 11
          }} />
        ))}
      </div>

      {/* Render Stickers on the Cover via Display Mode */}
      {!children && entry.coverStickers.map(s => (
         // eslint-disable-next-line @next/next/no-img-element
         <img key={s.id} src={s.src} alt="sticker" style={{
           position: 'absolute',
           left: `${s.x}%`, 
           top: `${s.y}%`,
           width: '25%', // Responsive width relative to the cover
           height: 'auto',
           zIndex: 1,
           mixBlendMode: 'multiply', // Magic: makes pure white backgrounds transparent!
           filter: 'drop-shadow(2px 3px 5px rgba(0,0,0,0.1))'
         }} />
      ))}

      {/* Editor Overlay mode */}
      {children}

      {/* Title Tag */}
      <div style={{ zIndex: 2, background: 'rgba(255,255,255,0.85)', padding: '5%', borderRadius: '12px', backdropFilter: 'blur(5px)', border: '2px solid rgba(255,224,130,0.6)' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: '#5D4037' }}>{entry.title}</h3>
        <p style={{ margin: 0, fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)', color: '#8D6E63' }}>{entry.date} · {entry.category}</p>
      </div>

      {/* Music Player */}
      {entry.music && (
        <div style={{ zIndex: 2, marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
           <PostPlayer uri={entry.music} id={`post-${entry.id}`} />
        </div>
      )}

      {/* Decorate Button */}
      {!isPreview && (
        <button 
          className="cute-button"
          style={{
            position: 'absolute',
            top: '5%',
            right: '5%',
            padding: '3% 6%',
            fontSize: 'clamp(0.6rem, 2vw, 0.85rem)',
            zIndex: 3,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/decorate/${entry.id}`);
          }}
        >
          🎨 꾸미기
        </button>
      )}
    </div>
  );
}
