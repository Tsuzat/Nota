/**
 * Function which return the icon type based on the icon name
 * @param email string - icon to validate
 * @returns iconType - `emoji` | `svg` | `url`
 */
export function getIconTypeAndData(iconWithPrefix: string) {
	const [prefix, icon] = iconWithPrefix.split(':');

	let iconType = '';

	switch (prefix) {
		case 'url':
			iconType = 'url';
			break;
		case 'emoji':
			iconType = 'emoji';
			break;
		case 'svg':
			iconType = 'svg';
			break;
		default:
			iconType = 'emoji';
	}
	return {
		type: iconType,
		icon: icon
	};
}
