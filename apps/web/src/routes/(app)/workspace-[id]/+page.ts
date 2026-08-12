import { redirect } from '@sveltejs/kit';

export const load = ({ params }) => {
  throw redirect(301, `/w/${params.id}`);
};
