import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet } from "@remix-run/react";

import { requireAuthSession } from "~/modules/auth";
import { getUserByEmail } from "~/modules/user";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";

export const handle = {
  breadcrumb: () => <Link to="/items">Items</Link>,
};

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request);
  const user = authSession
    ? await getUserByEmail(authSession?.email)
    : undefined;

  /* Just in case */
  if (!user) return redirect("/login");

  const header = {
    title: user.firstName ? `${user.firstName}'s stash` : `Your stash`,
    actions: [
      {
        props: {
          to: "items/new",
          className: "text-blue-500 underline",
          role: "link",
          "aria-label": "new item",
          "data-test-id": "createNewItem",
        },
        children: "+ Create new item",
      },
    ],
  };
  return json({ header });
}

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => [
  { title: appendToMetaTitle(data.header.title) },
];

export default function ItemsPage() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
