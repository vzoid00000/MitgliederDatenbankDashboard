import { useState } from "react";
import { ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { useActionData } from "react-router";
import PersonForm from "~/components/PersonForm";
import PersonListItem from "~/components/PersonListItem";
import { actionPersonData, loadPersonData } from "~/utils/person.server";

export const loader = async () => {
    return await loadPersonData();
};

export const action = async ({ request }: ActionFunctionArgs) => {
    return await actionPersonData(request);
};

export default function PersonList() {
    const { persons, geschlechter, telefonnummerTypen, roles, statuses, titles } =
        useLoaderData<typeof loader>();
    const actionData = useActionData() as { error?: string; success?: string } | undefined;
    const [editingPerson, setEditingPerson] = useState<number | null>(null);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Personenliste</h1>

            {actionData?.error && (
                <div className="mb-4 p-2 text-red-700 bg-red-100">{actionData.error}</div>
            )}
            {actionData?.success && (
                <div className="mb-4 p-2 text-green-700 bg-green-100">{actionData.success}</div>
            )}

            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
                Zurück zum Dashboard
            </Link>

            <PersonForm
                editingPerson={editingPerson}
                geschlechter={geschlechter}
                telefonnummerTypen={telefonnummerTypen}
                roles={roles}
                statuses={statuses}
                titles={titles}
                onCancelEdit={() => setEditingPerson(null)}
            />

            <ul className="space-y-4">
                {persons.map((person: any) => (
                    <PersonListItem key={person.person_id} person={person} />
                ))}
            </ul>
        </div>
    );
}
