import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library - ChronoChat",
  description:
    "Upload and manage your media files for real-time communication.",
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
