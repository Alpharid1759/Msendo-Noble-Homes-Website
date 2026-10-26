// src/app/(site)/gallery/videos/page.tsx
import { redirect } from "next/navigation";

export default function VideoGalleryIndex() {
  redirect("/gallery/videos/for-sale");
}
