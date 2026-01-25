import { useState, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function useElevenLabsTTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  const speak = async (text) => {
    if (!text || typeof text !== "string") {
      setError("Invalid text provided");
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsPlaying(true);

      const response = await fetch(`${API_BASE_URL}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Convert response to blob and create audio URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (err) => {
        setError("Failed to play audio");
        setIsPlaying(false);
      };

      await audio.play();
    } catch (err) {
      setError(err.message || "Failed to generate speech");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return {
    speak,
    stop,
    isLoading,
    isPlaying,
    error,
  };
}
