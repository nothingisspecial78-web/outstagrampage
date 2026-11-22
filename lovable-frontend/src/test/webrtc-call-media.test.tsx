import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { webrtc, RTC_CONFIG, WebRTCManager } from "@/lib/call/webrtc";
import { callSounds } from "@/lib/call/sound";
import { AudioMessagePlayer } from "@/components/hb/dm/AudioMessagePlayer";
import { MediaPostPlayer } from "@/components/hb/MediaPostPlayer";

describe("WebRTC & Real-Time Communication System", () => {
  it("configures STUN server with google stun endpoints", () => {
    expect(RTC_CONFIG.iceServers).toBeDefined();
    const urls = RTC_CONFIG.iceServers?.flatMap((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]));
    expect(urls).toContain("stun:stun.l.google.com:19302");
  });

  it("initializes WebRTCManager with clean initial state", () => {
    const manager = new WebRTCManager();
    expect(manager.getLocalStream()).toBeNull();
    expect(manager.getPeerConnection()).toBeNull();
  });

  it("handles audio and video toggling cleanly without errors", () => {
    const manager = new WebRTCManager();
    // When no local stream exists, returns false safely
    expect(manager.toggleAudio()).toBe(false);
    expect(manager.toggleVideo()).toBe(false);
  });

  it("tracks facing mode and handles camera switching safely without stream", async () => {
    const manager = new WebRTCManager();
    expect(manager.getFacingMode()).toBe("user");
    const result = await manager.switchCamera();
    expect(result).toBeNull();
  });

  it("safely handles call sound effects without throwing in non-browser/mock audio contexts", () => {
    expect(() => {
      callSounds.startOutgoingRingtone();
      callSounds.startIncomingRingtone();
      callSounds.stopRingtone();
      callSounds.playConnectedTone();
      callSounds.playEndTone();
    }).not.toThrow();
  });
});

describe("Voice Message Player", () => {
  it("renders audio player with play/pause and time display", () => {
    render(<AudioMessagePlayer audioUrl="data:audio/webm;base64,GkXfo59ChoEB" duration={15} mine={true} />);

    // Play button exists
    const playBtn = screen.getByRole("button", { name: /play audio/i });
    expect(playBtn).toBeDefined();

    // Time representation
    expect(screen.getByText("0:00")).toBeDefined();
    expect(screen.getByText("0:15")).toBeDefined();
  });
});

describe("Media Post Player for Feed & Rack", () => {
  it("renders custom video player with play, mute and seek controls", () => {
    render(
      <MediaPostPlayer
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        autoPlay={false}
      />
    );

    // Initial play overlay button
    const bigPlayBtn = screen.getByRole("button", { name: /play video/i });
    expect(bigPlayBtn).toBeDefined();

    // Mute toggle button
    const muteButtons = screen.getAllByRole("button", { name: /unmute video|mute video/i });
    expect(muteButtons.length).toBeGreaterThan(0);

    // Scrubber input
    const scrubber = screen.getByLabelText(/seek video position/i);
    expect(scrubber).toBeDefined();
  });

  it("stops playback and mutes video when scrolled away or isActive is false", () => {
    const { rerender } = render(
      <MediaPostPlayer
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        autoPlay={true}
        isActive={true}
      />
    );

    // Scrolled to another pic/card: isActive becomes false
    rerender(
      <MediaPostPlayer
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        autoPlay={true}
        isActive={false}
      />
    );

    // Replay/play overlay appears because video is safely stopped
    const playBtn = screen.getByRole("button", { name: /play video/i });
    expect(playBtn).toBeDefined();
  });
});
