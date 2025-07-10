export interface IconData {
	iconType: 'emoji' | 'lucide' | 'url';
	iconData: string;
}

export const getIconData = (icon: string): IconData => {
	switch (icon.split(':')[0]) {
		case 'emoji':
			return {
				iconType: 'emoji',
				iconData: icon.split(':')[1]
			};
		case 'lucide':
			return {
				iconType: 'lucide',
				iconData: icon.split(':')[1]
			};
		case 'url':
			return {
				iconType: 'url',
				iconData: icon.replace('url:', '')
			};
		default:
			return {
				iconType: 'emoji',
				iconData: '😊'
			};
	}
};
