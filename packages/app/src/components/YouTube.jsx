import * as React from 'react';

export function YouTube(props) {
  return (
    <div>
      <iframe
        {...props}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <style jsx>
        {`
          iframe {
            aspect-ratio: 16 / 9;
            margin: var(--default-vertical-spacing) 0;
            border-radius: 4px;
            border: 1px solid var(--code-border);
          }
        `}
      </style>
    </div>
  );
}

// ---
// const { props } = Astro.props;
// ---
// <iframe {...props} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="aspect-w-16 aspect-h-9 my-[var(--default-vertical-spacing)] rounded border-solid border-[1px] border-[color:var(--code-border)]"></iframe>
