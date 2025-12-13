<script lang="ts">
</script>

<div class="spotlight">
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
		/* Add a smooth fade-out at the bottom */
		-webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
		mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
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
			transparent 45%,
			var(--color-primary) 48%,
			color-mix(in srgb, var(--color-primary) 10%, var(--color-muted)) 50%,
			var(--color-primary) 50%,
			transparent 55%
		);
		transform-origin: 50% 0;
		filter: blur(20px) opacity(1);
		z-index: -1;
		animation:
			load 2s ease-in-out forwards,
			loadrot 2s ease-in-out forwards,
			spotlight 5s ease-in-out infinite reverse;
		transition: all 1s ease-in-out;
	}
	.spotlight > div:nth-child(1) {
		rotate: 20deg;
		animation:
			load 2s ease-in-out forwards,
			loadrot 2s ease-in-out forwards,
			spotlight 15s ease-in-out infinite;
	}
	.spotlight > div:nth-child(2) {
		rotate: -20deg;
		animation:
			load 2s ease-in-out forwards,
			loadrot 2s ease-in-out forwards,
			spotlight 10s ease-in-out infinite;
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
			filter: blur(15px) opacity(0.5);
		}
		20% {
			transform: rotateZ(-1deg) scale(1.2);
			filter: blur(16px) opacity(0.6);
		}
		40% {
			transform: rotateZ(2deg) scale(1.3);
			filter: blur(14px) opacity(0.4);
		}
		60% {
			transform: rotateZ(-2deg) scale(1.2);
			filter: blur(15px) opacity(0.6);
		}
		80% {
			transform: rotateZ(1deg) scale(1.1);
			filter: blur(13px) opacity(0.4);
		}
		100% {
			transform: rotateZ(0deg) scale(1);
			filter: blur(15px) opacity(0.5);
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
			top: 4rem;
		}
	}
</style>
