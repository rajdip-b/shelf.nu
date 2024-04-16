import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useAtomValue } from "jotai";
import { parseFormAny } from "react-zorm";
import { dynamicTitleAtom } from "~/atoms/dynamic-title-atom";
import Header from "~/components/layout/header";
import type { HeaderData } from "~/components/layout/header/types";
import {
  NewTemplateFormSchema,
  TemplateForm,
} from "~/components/templates/form";

import {
  getTemplateById,
  updateTemplate,
  updateTemplatePDF,
} from "~/modules/template";

import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { sendNotification } from "~/utils/emitter/send-notification.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // @ts-expect-error @TODO update to use new method
  await requireAuthSession(request);

  // @ts-expect-error @TODO update to use new method
  const id = getRequiredParam(params, "templateId");

  const template = await getTemplateById({ id });
  if (!template) {
    throw new Response("Not Found", { status: 404 });
  }

  const header: HeaderData = {
    title: `Edit | ${template.name}`,
  };

  return json({
    template,
    header,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? appendToMetaTitle(data.header.title) : "" },
];

export const handle = {
  breadcrumb: () => "Edit",
};

export async function action({ request, params }: ActionFunctionArgs) {
  // @ts-expect-error @TODO update to use new method
  assertIsPost(request);
  // @ts-expect-error @TODO update to use new method
  const authSession = await requireAuthSession(request);
  // @ts-expect-error @TODO update to use new method
  const { organizationId } = await requireOrganisationId(authSession, request);

  // @ts-expect-error @TODO update to use new method
  const id = getRequiredParam(params, "templateId");
  const clonedData = request.clone();
  const formData = await request.formData();
  const result = await NewTemplateFormSchema.safeParseAsync(
    parseFormAny(formData)
  );

  if (!result.success) {
    return json(
      {
        errors: result.error,
        success: false,
      },
      {
        status: 400,
        headers: {
          // @ts-expect-error @TODO update to use new method
          "Set-Cookie": await commitAuthSession(request, { authSession }),
        },
      }
    );
  }

  const { name, description, signatureRequired, pdf } = result.data;

  await updateTemplate({
    id,
    name,
    description: description ?? "",
    signatureRequired: signatureRequired ?? false,
    userId: authSession.userId,
  });

  await updateTemplatePDF({
    pdfName: pdf.name,
    pdfSize: pdf.size,
    request: clonedData,
    templateId: id,
    organizationId,
  });

  sendNotification({
    title: "Template updated",
    message: "Your template has been updated successfully",
    icon: { name: "success", variant: "success" },
    senderId: authSession.userId,
  });

  return redirect("/settings/template", {
    headers: {
      // @ts-expect-error @TODO update to use new method
      "Set-Cookie": await commitAuthSession(request, { authSession }),
    },
  });
}

export default function TemplateEditPage() {
  const name = useAtomValue(dynamicTitleAtom);
  const hasName = name !== "";
  const { template } = useLoaderData<typeof loader>();

  return (
    <>
      <Header
        title={hasName ? name : template.name}
        hideBreadcrumbs
        classNames="-mt-5"
      />
      <div className=" items-top flex justify-between">
        <TemplateForm
          isEdit
          name={template.name || name}
          description={template.description}
          type={template.type}
          signatureRequired={template.signatureRequired}
          pdfUrl={template.pdfUrl}
          pdfSize={template.pdfSize}
          pdfName={template.pdfName}
        />
      </div>
    </>
  );
}