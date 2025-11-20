// app/page.tsx
'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8">Video Call Rooms</h1>
        <button onClick={createRoom} className="bg-white text-purple-800 px-12 py-6 rounded-2xl text-2xl font-bold shadow-2xl hover:scale-105 transition">
          Create New Room
        </button>
        <p className="text-white mt-8 text-lg">Like Google Meet — just click and share the link!</p>
      </div>
    </div>
  );
}