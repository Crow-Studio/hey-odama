/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

// Types for our stream management
type PeerStreams = Record<string, MediaStream[]>;

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();

  // --- State ---
  // We store an array of streams per peer (0 = Cam, 1 = Screen, usually)
  const [remoteStreams, setRemoteStreams] = useState<PeerStreams>({});
  const [peers, setPeers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const [isTabDuplicate, setIsTabDuplicate] = useState(false);

  // --- Local Media State ---
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // --- Refs ---
  const wsRef = useRef<WebSocket | null>(null);
  const pcRefs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const myIdRef = useRef<string>("");
  const makingOfferRef = useRef<boolean>(false);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // 1. DUPLICATE TAB CHECK
  useEffect(() => {
    const roomKey = `room_joined_${roomId}`;
    if (localStorage.getItem(roomKey) === "true") {
      setIsTabDuplicate(true);
      return;
    }
    localStorage.setItem(roomKey, "true");

    const cleanup = () => {
      localStorage.removeItem(roomKey);
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };

    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, [roomId]);

  // 2. INITIAL MEDIA SETUP (Camera)
  useEffect(() => {
    if (isTabDuplicate) return;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Always mute local self
        }
      } catch (err) {
        console.error("Media Error:", err);
        alert("Could not access camera/mic");
      }
    };
    initMedia();
  }, [isTabDuplicate]);

  // --- CORE WEBRTC FUNCTIONS ---

  const createPeerConnection = (peerId: string) => {
    if (pcRefs.current.has(peerId)) return pcRefs.current.get(peerId)!;

    const pc = new RTCPeerConnection(iceServers);
    pcRefs.current.set(peerId, pc);

    // 1. Add Local Camera Tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // 2. Add Screen Tracks (if already sharing when new person joins)
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, screenStreamRef.current!);
      });
    }

    // 3. Handle Incoming Tracks (The key to seeing remote screens)
    pc.ontrack = (e) => {
      const stream = e.streams && e.streams[0];
      if (!stream) {
        console.warn(
          `Received ontrack event from ${peerId} with no streams`,
          e,
        );
        return;
      }
      console.log(`Received track from ${peerId}:`, stream.id, e.track.kind);

      setRemoteStreams((prev) => {
        const existing = prev[peerId] || [];
        // Prevent duplicates based on stream ID
        if (existing.some((s) => s.id === stream.id)) return prev;
        return { ...prev, [peerId]: [...existing, stream] };
      });

      // Handle stream ending (user stops screen share)
      stream.onremovetrack = () => {
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: (prev[peerId] || []).filter((s) => s.id !== stream.id),
        }));
      };
    };

    // 4. ICE Candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        send({
          type: "ice-candidate",
          candidate: e.candidate,
          targetId: peerId,
        });
      }
    };

    // 5. Negotiation Needed (Triggered when we add/remove tracks)
    // This allows us to add screen share mid-call without breaking connection
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ type: "offer", offer, targetId: peerId });
      } catch (err) {
        console.error("Negotiation Error", err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    return pc;
  };

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  // --- SIGNALING HANDLERS ---

  const joinRoom = () => {
    setIsPreview(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = apiUrl
      ? apiUrl.replace(/^http/, "ws") + `/ws?room=${roomId}`
      : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws?room=${roomId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = async (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "joined") {
        myIdRef.current = data.clientId;
        setPeers(data.peers);
        // Connect to existing peers
        data.peers.forEach((p: string) => createPeerConnection(p));
      }

      if (data.type === "peer-joined") {
        setPeers((prev) => [...prev, data.peerId]);
        createPeerConnection(data.peerId);
        // Note: We don't createOffer here manually.
        // createPeerConnection -> addTrack -> onnegotiationneeded -> createOffer
      }

      if (data.type === "peer-left") {
        setPeers((prev) => prev.filter((p) => p !== data.peerId));
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[data.peerId];
          return newStreams;
        });
        pcRefs.current.get(data.peerId)?.close();
        pcRefs.current.delete(data.peerId);
      }

      if (data.type === "offer") {
        const pc = createPeerConnection(data.fromId);
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: "answer", answer, targetId: data.fromId });
      }

      if (data.type === "answer") {
        const pc = pcRefs.current.get(data.fromId);
        await pc?.setRemoteDescription(data.answer);
      }

      if (data.type === "ice-candidate") {
        const pc = pcRefs.current.get(data.fromId);
        await pc?.addIceCandidate(data.candidate);
      }
    };
  };

  // --- ACTIONS ---

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getAudioTracks()
        .forEach((t) => (t.enabled = !micOn));
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getVideoTracks()
        .forEach((t) => (t.enabled = !videoOn));
      setVideoOn(!videoOn);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      // STOP SHARING
      stopScreenShare();
    } else {
      // START SHARING
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = stream;
        setScreenSharing(true);

        // Add screen track to ALL existing peer connections
        // This will trigger 'onnegotiationneeded' automatically
        const videoTracks = stream.getVideoTracks();
        const screenTrack = videoTracks[0];

        if (screenTrack) {
          pcRefs.current.forEach((pc) => {
            pc.addTrack(screenTrack, stream);
          });

          // Handle user clicking "Stop Sharing" on browser UI
          screenTrack.onended = () => stopScreenShare();
        } else {
          // No video track available — stop sharing and cleanup
          stopScreenShare();
        }
      } catch (err) {
        console.log("Cancelled screen share", err);
      }
    }
  };

  const stopScreenShare = () => {
    if (!screenStreamRef.current) return;

    const tracks = screenStreamRef.current.getTracks();
    tracks.forEach((t) => t.stop());

    // Remove tracks from PeerConnections
    pcRefs.current.forEach((pc) => {
      const senders = pc.getSenders();
      const label = tracks[0]?.label;
      const sender = label
        ? senders.find(
            (s) => s.track?.kind === "video" && s.track?.label === label,
          )
        : undefined;
      if (sender) pc.removeTrack(sender);
      // Removing track triggers negotiation needed -> new offer -> remote removes stream
    });

    screenStreamRef.current = null;
    setScreenSharing(false);
  };

  // --- RENDER ---

  if (isTabDuplicate) return <DuplicateTabError />;
  if (isPreview)
    return (
      <PreviewScreen
        micOn={micOn}
        videoOn={videoOn}
        toggleMic={toggleMic}
        toggleVideo={toggleVideo}
        onJoin={joinRoom}
        videoRef={localVideoRef}
      />
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <h1 className="font-bold text-lg">Room: {roomId}</h1>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition"
        >
          Copy Link
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* 1. My Camera */}
          <VideoCard
            stream={localStreamRef.current}
            muted={true}
            label="You (Camera)"
            mirrored={!screenSharing} // Mirror camera, but not if sharing (optional preference)
            isOff={!videoOn}
          />

          {/* 2. My Screen (if sharing) */}
          {screenSharing && (
            <VideoCard
              stream={screenStreamRef.current}
              muted={true}
              label="You (Screen)"
              isScreen={true}
            />
          )}

          {/* 3. Remote Peers (Loop through all their streams) */}
          {peers.map((peerId) => {
            const streams = remoteStreams[peerId] || [];
            if (streams.length === 0) {
              // Placeholder if connected but no video yet
              return (
                <div
                  key={peerId}
                  className="bg-gray-800 rounded-xl aspect-video flex items-center justify-center shadow-lg"
                >
                  <span className="text-gray-500">
                    Peer {peerId.slice(0, 4)} joining...
                  </span>
                </div>
              );
            }

            return streams.map((stream, idx) => (
              <VideoCard
                key={`${peerId}-${stream.id}`}
                stream={stream}
                muted={false} // Hear remote peers
                label={`Peer ${peerId.slice(0, 4)} ${streams.length > 1 ? (idx === 0 ? "(Cam)" : "(Screen)") : ""}`}
                isScreen={streams.length > 1 && idx > 0} // Guessing 2nd stream is screen
              />
            ));
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-900 border-t border-gray-800 p-6 flex justify-center gap-4">
        <ControlBtn
          onClick={toggleMic}
          active={micOn}
          onIcon="🎤"
          offIcon="🔇"
        />
        <ControlBtn
          onClick={toggleVideo}
          active={videoOn}
          onIcon="📹"
          offIcon="🚫"
        />
        <button
          onClick={toggleScreenShare}
          className={`px-6 py-4 rounded-full font-bold text-lg transition shadow-lg flex items-center gap-2 ${screenSharing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {screenSharing ? "Stop Sharing" : "Share Screen"}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 font-bold shadow-lg"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function VideoCard({ stream, muted, label, mirrored, isScreen, isOff }: any) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div
      className={`relative bg-gray-800 rounded-xl overflow-hidden aspect-video shadow-xl ring-1 ring-gray-700 group`}
    >
      {stream && (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full bg-black ${isScreen ? "object-contain" : "object-cover"} ${mirrored ? "transform -scale-x-100" : ""} ${isOff ? "hidden" : ""}`}
        />
      )}

      {isOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <span className="text-gray-500 text-xl">Camera Off</span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium">
        {label}
      </div>
    </div>
  );
}

function ControlBtn({ onClick, active, onIcon, offIcon }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 rounded-full text-2xl flex items-center justify-center transition shadow-lg ${active ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"}`}
    >
      {active ? onIcon : offIcon}
    </button>
  );
}

function DuplicateTabError() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md p-6 bg-gray-900 border border-red-800 rounded-xl">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Tab Conflict</h2>
        <p className="text-gray-400 mb-4">
          You are already in this room. Please use the existing tab.
        </p>
        <button
          onClick={() => window.close()}
          className="bg-red-600 px-6 py-2 rounded-lg"
        >
          Close Tab
        </button>
      </div>
    </div>
  );
}

function PreviewScreen({
  micOn,
  videoOn,
  toggleMic,
  toggleVideo,
  onJoin,
  videoRef,
}: any) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-8">Join Room</h1>
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-8 ring-2 ring-blue-500/30">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover transform -scale-x-100 ${!videoOn && "hidden"}`}
          />
          {!videoOn && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Camera Off
            </div>
          )}
        </div>
        <div className="flex justify-center gap-6 mb-8">
          <ControlBtn
            onClick={toggleMic}
            active={micOn}
            onIcon="🎤"
            offIcon="🔇"
          />
          <ControlBtn
            onClick={toggleVideo}
            active={videoOn}
            onIcon="📹"
            offIcon="🚫"
          />
        </div>
        <button
          onClick={onJoin}
          className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg transition"
        >
          Enter Meeting
        </button>
      </div>
    </div>
  );
}
