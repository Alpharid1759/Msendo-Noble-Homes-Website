// src/app/(site)/gallery/photos/page.tsx
import { redirect } from "next/navigation";

export default function PhotoGalleryIndex() {
  redirect("/gallery/photos/for-sale");
}
