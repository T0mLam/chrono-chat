import axiosClient from "@/lib/axiosClient";

export interface VideoResponse {
  status: string;
  message: string;
}

export interface VideoDetails {
  filename: string;
  upload_time: string;
  is_processed: boolean;
  duration: number;
  task_id: string;
  task_status: string;
  task_progress: number;
  thumbnail_path: string;
}

export async function listUploadedVideos(): Promise<VideoDetails[]> {
  const response = await axiosClient.get<VideoDetails[]>("/media/videos");
  return response.data;
}

export async function uploadYoutubeVideo(url: string): Promise<VideoResponse> {
  const response = await axiosClient.post(
    `/media/upload/youtube_video?url=${encodeURIComponent(url)}`
  );
  return response.data;
}

export async function checkYouTubeVideo(url: string): Promise<{
  downloadable: boolean;
  url: string;
}> {
  const response = await axiosClient.get("/media/check_youtube_video", {
    params: { url },
  });
  return response.data;
}

export async function uploadLocalVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<VideoResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosClient.post(
    "/media/upload/local_video",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    }
  );
  return response.data;
}

export async function deleteVideo(filename: string): Promise<VideoResponse> {
  const response = await axiosClient.delete(`/media/delete_video/${filename}`);
  return response.data;
}
