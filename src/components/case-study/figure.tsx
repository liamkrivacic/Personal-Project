import Image from "next/image";

type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
  wide?: boolean;
  width?: number;
  height?: number;
};

export function Figure({ src, alt, caption, wide = false, width = 1200, height = 800 }: FigureProps) {
  return (
    <figure className={`cs-figure${wide ? " wide" : ""}`}>
      <Image className="cs-figure-img" src={src} alt={alt} width={width} height={height} />
      {caption ? <figcaption className="cs-figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}
