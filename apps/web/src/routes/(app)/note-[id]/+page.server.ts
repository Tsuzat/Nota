import { redirect } from '@sveltejs/kit';

export const load = ({ params }) => {
  throw redirect(301, `/n/${params.id}`);
};
