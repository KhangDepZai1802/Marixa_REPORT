import { toBlob } from "html-to-image";
export async function exportReport(element: HTMLElement) {
  await document.fonts.ready;
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = "760px";
  clone.style.maxWidth = "none";
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.margin = "0";
  document.body.appendChild(clone);
  try {
    await Promise.all(
      Array.from(clone.querySelectorAll("img")).map((img) => img.decode()),
    );
    const blob = await toBlob(clone, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: 760,
      height: clone.scrollHeight,
      style: { position: "static", left: "auto", top: "auto", width: "760px" },
      cacheBust: false,
    });
    if (!blob) throw new Error("Không tạo được ảnh. Vui lòng thử lại.");
    return blob;
  } finally {
    clone.remove();
  }
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
