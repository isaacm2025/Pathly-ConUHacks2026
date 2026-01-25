// ElevenLabs Text-to-Speech API integration
// Falls back to browser speech synthesis if no API key

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default voice - Rachel (clear, friendly female voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

// Voice options for different contexts
export const VOICE_OPTIONS = {
  navigation: '21m00Tcm4TlvDq8ikWAM', // Rachel - calm, clear
  alert: 'AZnzlk1XvdvUeBnXmlld', // Domi - slightly more urgent
  friendly: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, friendly
};

class VoiceAssistant {
  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    this.isPlaying = false;
    this.audioQueue = [];
    this.currentAudio = null;
    this.useElevenLabs = !!this.apiKey;
  }

  // Speak text using ElevenLabs or fallback to browser
  async speak(text, options = {}) {
    const { 
      voiceId = DEFAULT_VOICE_ID,
      priority = 'normal', // 'high' interrupts current speech
      onStart,
      onEnd,
      onError
    } = options;

    // If high priority, stop current speech
    if (priority === 'high' && this.isPlaying) {
      this.stop();
    }

    // If already playing and not high priority, queue it
    if (this.isPlaying && priority !== 'high') {
      this.audioQueue.push({ text, options });
      return;
    }

    this.isPlaying = true;
    onStart?.();

    try {
      if (this.useElevenLabs) {
        await this.speakWithElevenLabs(text, voiceId);
      } else {
        await this.speakWithBrowser(text);
      }
      onEnd?.();
    } catch (error) {
      console.error('Voice assistant error:', error);
      // Fallback to browser speech on ElevenLabs error
      if (this.useElevenLabs) {
        try {
          await this.speakWithBrowser(text);
          onEnd?.();
        } catch (browserError) {
          onError?.(browserError);
        }
      } else {
        onError?.(error);
      }
    } finally {
      this.isPlaying = false;
      this.processQueue();
    }
  }

  // ElevenLabs API call
  async speakWithElevenLabs(text, voiceId) {
    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      this.currentAudio.onerror = reject;
      this.currentAudio.play();
    });
  }

  // Browser Speech Synthesis fallback
  async speakWithBrowser(text) {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to use a nice voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Google') ||
        v.name.includes('Female')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = resolve;
      utterance.onerror = reject;
      
      window.speechSynthesis.speak(utterance);
    });
  }

  // Stop current speech
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    window.speechSynthesis?.cancel();
    this.isPlaying = false;
    this.audioQueue = [];
  }

  // Process queued messages
  processQueue() {
    if (this.audioQueue.length > 0 && !this.isPlaying) {
      const { text, options } = this.audioQueue.shift();
      this.speak(text, options);
    }
  }

  // Check if ElevenLabs is available
  isElevenLabsAvailable() {
    return this.useElevenLabs;
  }
}

// Singleton instance
export const voiceAssistant = new VoiceAssistant();

export default voiceAssistant;
