<script lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar/index";

interface Props {
	image: string | null;
	name: string;
	class?: string;
}
const { image, name, class: className }: Props = $props();

const getInitials = $derived.by(() => {
	const names = name.split(" ");
	const firstName = names[0];
	const lastName = names[names.length - 1];
	return `${firstName?.[0]}${lastName?.[0]}`.toUpperCase();
});
</script>

<Avatar class={className}>
	<AvatarImage class="rounded-lg border" src={image} alt={name} />
	<AvatarFallback class="border">{getInitials}</AvatarFallback>
</Avatar>