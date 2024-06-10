import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import YouTube, { YouTubePlayer, YouTubeProps } from "react-youtube";
import "./App.css";

const socket = io("http://localhost:3000");

type YoutubeVideo = {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
        width: number;
        height: number;
      };
      medium: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };

}

function App() {
  const [videoQueue, setVideoQueue] = useState<YoutubeVideo[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    socket.on("video", (video: YoutubeVideo) => {
      console.log("Received video:", video);
      setVideoQueue((prevQueue) => [...prevQueue, video]);
    });

    socket.on("skip", () => {
      playNextVideo();
    });

    return () => {
      socket.off("video");
      socket.off("skip");
    };
  }, []);

  useEffect(() => {
    if (!currentVideoId && videoQueue.length > 0) {
      playNextVideo();
    }
  }, [videoQueue, currentVideoId]);

  const playNextVideo = () => {
    if (videoQueue.length > 0) {
      const nextVideo = videoQueue[0];
      setVideoQueue((prevQueue) => prevQueue.slice(1));
      playerRef.current?.loadVideoById(nextVideo.id.videoId);
      setCurrentVideoId(nextVideo.id.videoId);
      
    }
  };

  const handleVideoEnd = () => {
    setCurrentVideoId(null);
  };

  const opts: YouTubeProps['opts'] = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <>
      <h1>YouTube Queue</h1>
      <p>{currentVideoId ? `Currently playing: ${currentVideoId}` : "No video is currently playing"}</p>
      {currentVideoId && (
        <YouTube
          videoId={currentVideoId}
          ref={playerRef}
          onEnd={handleVideoEnd}
          opts={opts}
          onReady={() => playerRef.current?.playVideo()}
        />
      )}
      <div>
        {videoQueue.map((video: YoutubeVideo) => (
          <div key={video.id.videoId}>
            <h3>{video.snippet.title}</h3>
            <p>{video.snippet.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
