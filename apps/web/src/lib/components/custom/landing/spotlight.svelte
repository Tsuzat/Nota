<div class="spotlight mt-10!">
  <div></div>
  <div></div>
  <div></div>
</div>

<style>
  .spotlight {
    overflow: hidden !important;
    pointer-events: none;
    position: absolute;
    margin: 0 auto;
    transition: filter 1s ease-in-out;
    height: 40rem;
    width: 100%;
    z-index: -10;
    /* Add a smooth fade-out towards the bottom */
    -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 95%);
    mask-image: linear-gradient(to bottom, black 50%, transparent 95%);
  }
  .spotlight > div {
    border-radius: 0 0 50% 50%;
    position: absolute;
    left: 0;
    right: 0;
    margin: 0 auto;
    top: 2rem;
    width: 100%;
    height: 100%;
    background-image: conic-gradient(
      from 0deg at 50% -5%,
      transparent 46%,
      color-mix(in srgb, var(--color-primary) 35%, transparent) 48.5%,
      color-mix(in srgb, var(--color-primary) 65%, transparent) 50%,
      color-mix(in srgb, var(--color-primary) 35%, transparent) 51.5%,
      transparent 54%
    );
    transform-origin: 50% 0;
    filter: blur(20px) opacity(0.8);
    z-index: -1;
    animation:
      load 2s ease-in-out forwards,
      loadrot 2s ease-in-out forwards,
      spotlight 6s ease-in-out infinite reverse;
    transition: all 1s ease-in-out;
  }
  .spotlight > div:nth-child(1) {
    rotate: 15deg;
    animation:
      load 2s ease-in-out forwards,
      loadrot 2s ease-in-out forwards,
      spotlight 16s ease-in-out infinite;
  }
  .spotlight > div:nth-child(2) {
    rotate: -15deg;
    animation:
      load 2s ease-in-out forwards,
      loadrot 2s ease-in-out forwards,
      spotlight 12s ease-in-out infinite;
  }
  @keyframes loadrot {
    0% {
      rotate: 0deg;
      scale: 0;
    }
    100% {
      scale: 1;
    }
  }
  @keyframes spotlight {
    0% {
      transform: rotateZ(0deg) scale(1);
      filter: blur(22px) opacity(0.6);
    }
    20% {
      transform: rotateZ(-1deg) scale(1.15);
      filter: blur(25px) opacity(0.7);
    }
    40% {
      transform: rotateZ(2deg) scale(1.2);
      filter: blur(20px) opacity(0.5);
    }
    60% {
      transform: rotateZ(-2deg) scale(1.15);
      filter: blur(24px) opacity(0.7);
    }
    80% {
      transform: rotateZ(1deg) scale(1.05);
      filter: blur(20px) opacity(0.5);
    }
    100% {
      transform: rotateZ(0deg) scale(1);
      filter: blur(22px) opacity(0.6);
    }
  }
  @keyframes load {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @media (max-width: 600px) {
    .spotlight {
      height: 80%;
    }
    .spotlight > div {
      top: 2rem;
    }
  }
</style>
