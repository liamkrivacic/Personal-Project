type VideoProps = {
  src: string;
  poster: string;
  caption?: string;
};

export function Video({ src, poster, caption }: VideoProps) {
  return (
    <figure className="cs-figure cs-video">
      <video
        className="cs-figure-img"
        src={src}
        poster={poster}
        controls
        muted
        playsInline
        preload="none"
      />
      {caption ? <figcaption className="cs-figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}
