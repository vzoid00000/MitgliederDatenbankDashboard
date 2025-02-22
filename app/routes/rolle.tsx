import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const rollen = await prisma.rolle.findMany();
    return json({ rollen });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");

    switch (action) {
        case "create":
        case "update":
            const rolleId = formData.get("rolle_id");
            const rolleData = {
                rolle_bezeichnung: formData.get("rolle_bezeichnung") as string,
            };

            if (action === "create") {
                await prisma.rolle.create({ data: rolleData });
            } else {
                await prisma.rolle.update({
                    where: { rolle_id: Number.parseInt(rolleId as string) },
                    data: rolleData,
                });
            }
            break;

        case "delete":
            const deleteId = formData.get("rolle_id");
            await prisma.rolle.delete({ where: { rolle_id: Number.parseInt(deleteId as string) } });
            break;
    }

    return null;
};

export default function RolleList() {
    const { rollen } = useLoaderData<typeof loader>();
    const [editingRolle, setEditingRolle] = useState<number | null>(null);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Rollenliste</h1>
            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
                Zurück zum Dashboard
            </Link>

            <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
                <input type="hidden" name="_action" value={editingRolle ? "update" : "create"} />
                {editingRolle && <input type="hidden" name="rolle_id" value={editingRolle} />}
                <div>
                    <label htmlFor="rolle_bezeichnung" className="block">
                        Rollen Bezeichnung
                    </label>
                    <input
                        type="text"
                        id="rolle_bezeichnung"
                        name="rolle_bezeichnung"
                        required
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {editingRolle ? "Aktualisieren" : "Erstellen"}
                </button>
                {editingRolle && (
                    <button
                        type="button"
                        onClick={() => setEditingRolle(null)}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Abbrechen
                    </button>
                )}
            </Form>

            <ul className="space-y-4">
                {rollen.map((rolle) => (
                    <li key={rolle.rolle_id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <span>{rolle.rolle_bezeichnung}</span>
                        <div>
                            <button
                                onClick={() => setEditingRolle(rolle.rolle_id)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                            >
                                Bearbeiten
                            </button>
                            <Form method="post" style={{ display: "inline" }}>
                                <input type="hidden" name="_action" value="delete" />
                                <input type="hidden" name="rolle_id" value={rolle.rolle_id} />
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={(e) => {
                                        if (!confirm("Sind Sie sicher, dass Sie diese Rolle löschen möchten?")) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    Löschen
                                </button>
                            </Form>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}