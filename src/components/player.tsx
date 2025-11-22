/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { useCallback, useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeProps, type YouTubePlayer } from "react-youtube";
import { QrCode } from "./qr-code";
import { type VideoInPlaylist } from "party";
import { decode } from "html-entities";
import { cn } from "~/lib/utils";
import { Button } from "./ui/ui/button";
import { MicVocal, SkipForward, Youtube } from "lucide-react";
import { Spinner } from "./ui/ui/spinner";
import { useAutoplay } from "~/hooks/useAutoplay";
import { AUTOPLAY_MESSAGES } from "~/utils/autoplay-constants";

type Props = {
  joinPartyUrl: string;
  video: VideoInPlaylist;
  isFullscreen: boolean;
  autoplay?: boolean;
  onPlayerEnd: () => void;
  onTogglePlayPauseRef?: React.MutableRefObject<(() => void) | null>;
};

export function Player({
  joinPartyUrl,
  video,
  isFullscreen = false,
  autoplay = false,
  onPlayerEnd,
  onTogglePlayPauseRef,
}: Props) {
  const playerRef = useRef<YouTubePlayer>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use the autoplay hook
  const {
    showManualPlayButton,
    showOpenInYouTubeButton,
    showDelayedAutoplayMessage,
    hasAutoRedirected,
    isWindowFocused,
    handlePlayerReady,
    handlePlayerPlay,
    handlePlayerError,
    openYouTubeTab,
    resetManualPlayButton,
  } = useAutoplay({
    autoplay,
    onPlayerEnd,
    videoId: video.id,
  });

  // Reset basic state when video changes
  useEffect(() => {
    setIsReady(false);
    setIsPlaying(false);
  }, [video.id]);

  const opts: YouTubeProps["opts"] = {
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      start: 0,
      autoplay: 0,
      rel: 0,
      controls: 1,
    },
  };

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    // access to player in all event handlers via event.target
    playerRef.current = event.target;

    // Player is ready to play (regardless of current state)
    setIsReady(true);

    // Check actual player state - YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    const playerState = event.target.getPlayerState();
    const isPlayerPlaying = playerState === 1; // 1 = playing

    // Use autoplay hook for autoplay logic
    handlePlayerReady(event.target, isPlayerPlaying);
  };

  const onPlayerPlay: YouTubeProps["onPlay"] = (_event) => {
    setIsPlaying(true);
    handlePlayerPlay();
  };

  const onPlayerPause: YouTubeProps["onPause"] = (_event) => {
    setIsPlaying(false);
  };

  const onPlayerError: YouTubeProps["onError"] = (_event) => {
    handlePlayerError();
  };

  if (showOpenInYouTubeButton) {
    return (
      <div
        className={cn(
          "mx-auto flex h-full w-full flex-col items-center justify-between space-y-6 p-4 pb-1 text-center",
          isFullscreen && "bg-gradient",
        )}
      >
        <div>
          <h1 className="text-outline scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            {decode(video.title)}
          </h1>
          <h2 className="text-outline scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
            <MicVocal className="mr-2 inline text-primary" size={32} />
            {video.singerName}
            <MicVocal
              className="ml-2 inline scale-x-[-1] transform text-primary"
              size={32}
            />
          </h2>
        </div>

        <div>
          <h3 className="mb-2 scroll-m-20 text-2xl font-semibold tracking-tight animate-in fade-in zoom-in">
            This video cannot be embedded. Click the button to open a new tab in
            YouTube.
          </h3>
          {autoplay && isWindowFocused && !hasAutoRedirected && (
            <p className="text-lg mb-4 text-muted-foreground">
              {AUTOPLAY_MESSAGES.AUTO_REDIRECTING}
            </p>
          )}
          {autoplay && !isWindowFocused && (
            <p className="text-lg mb-4 text-muted-foreground">
              {AUTOPLAY_MESSAGES.AUTO_REDIRECT_PAUSED}
            </p>
          )}
          <Button
            type="button"
            className="w-fit self-center animate-in fade-in zoom-in"
            onClick={() => openYouTubeTab(true)}
          >
            Play in YouTube
            <Youtube className="ml-2" />
          </Button>
          <div className="mt-2">
            <Button
              className="animate-in fade-in zoom-in"
              variant={"secondary"}
              type="button"
              onClick={() => {
                onPlayerEnd();
              }}
            >
              <SkipForward className="mr-2 h-5 w-5" />
              Skip
            </Button>
          </div>
        </div>

        <div className="relative flex w-full basis-1/4 items-end text-center">
          <QrCode url={joinPartyUrl} />
          <a
            href={joinPartyUrl}
            target="_blank"
            className="pl-4 font-mono text-xl text-white"
          >
            {joinPartyUrl.split("//")[1]}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-full">
      <YouTube
        key={video.id}
        loading="eager"
        // className={`h-full w-full`}
        className={`h-full w-full animate-in fade-in ${
          isReady ? "visible" : "invisible"
        }`}
        iframeClassName="w-full h-full"
        // iframeClassName="p2 fixed bottom-0 right-0 h-auto min-h-full w-auto min-w-full"
        videoId={video.id}
        opts={opts}
        onPlay={onPlayerPlay}
        onReady={onPlayerReady}
        onPause={onPlayerPause}
        onError={onPlayerError}
        onEnd={() => {
          onPlayerEnd();
        }}
      />
      <div
        className={cn(
          "absolute top-0 w-full text-center animate-in fade-in zoom-in",
          isPlaying ? "hidden" : "block",
        )}
      >
        <div
          className={`flex w-full flex-col items-center justify-center bg-black p-4 ${
            isReady ? "bg-opacity-80" : "bg-opacity-0"
          }`}
        >
          <h1 className="text-outline scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            {decode(video.title)}
          </h1>
          <h2 className="text-outline scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
            <MicVocal className="mr-2 inline text-primary" size={32} />
            {video.singerName}
            <MicVocal
              className="ml-2 inline scale-x-[-1] transform text-primary"
              size={32}
            />
          </h2>
          {showDelayedAutoplayMessage && (
            <p className="text-lg mt-4 text-muted-foreground">
              {AUTOPLAY_MESSAGES.AUTOPLAY_DELAYED}
            </p>
          )}
          {showManualPlayButton && !isPlaying && (
            <div className="mt-4">
              <p className="text-lg mb-2 text-muted-foreground">
                {AUTOPLAY_MESSAGES.AUTOPLAY_BLOCKED}
              </p>
              <Button
                onClick={() => {
                  if (playerRef.current) {
                    try {
                      playerRef.current.playVideo();
                      resetManualPlayButton();
                    } catch (error: unknown) {
                      console.log("Manual play failed:", error);
                    }
                  }
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Play Video
              </Button>
            </div>
          )}
        </div>

        {!isReady && (
          <div>
            <Spinner size={"large"} />
          </div>
        )}
      </div>

      <div className="absolute bottom-12 left-0 z-10 flex w-full flex-row justify-between px-4">
        <QrCode url={joinPartyUrl} />

        <div
          className={`self-end p-2 ${
            isPlaying && isFullscreen ? "hidden" : "block"
          }`}
        >
          <Button
            // className="bg-yellow-300"
            variant={"secondary"}
            type="button"
            onClick={() => {
              onPlayerEnd();
            }}
          >
            <SkipForward className="mr-2 h-5 w-5" />
            Skip
          </Button>
          {/* <a
            href={joinPartyUrl}
            target="_blank"
            className="font-mono text-xl text-white"
          >
            {joinPartyUrl.split("//")[1]}
          </a> */}
        </div>
      </div>
    </div>
  );
}
