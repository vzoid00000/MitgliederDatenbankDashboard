import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const titelTypen = await prisma.titel_typ.findMany();
    return json({ titelTypen });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");

    switch (action) {
        case "create":
        case "update":
            const titelTypId = formData.get("titel_typ_id");
            const titelTypData = {
                titel_typ_bezeichnung: formData.get("titel_typ_bezeichnung") as string,
            };

            if (action === "create") {
                await prisma.titel_typ.create({ data: titelTypData });
            } else {
                await prisma.titel_typ.update({
                    where: { titel_typ_id: Number.parseInt(titelTypId as string) },
                    data: titelTypData,
                });
            }
            break;

        case "delete":
            const deleteId = formData.get("titel_typ_id");
            await prisma.titel_typ.delete({ where: { titel_typ_id: Number.parseInt(deleteId as string) } });
            break;
    }

    return null;
};

export default function TitelTypList() {
    const { titelTypen } = useLoaderData<typeof loader>();
    const [editingTitelTyp, setEditingTitelTyp] = useState<number | null>(null);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Titel-Typen</h1>
            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
                Zurück zum Dashboard
            </Link>

            {/* Formular für neue Titel-Typen */}
            <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
                <input type="hidden" name="_action" value={editingTitelTyp ? "update" : "create"} />
                {editingTitelTyp && <input type="hidden" name="titel_typ_id" value={editingTitelTyp} />}
                <div>
                    <label htmlFor="titel_typ_bezeichnung" className="block">
                        Titel-Typ Bezeichnung
                    </label>
                    <input
                        type="text"
                        id="titel_typ_bezeichnung"
                        name="titel_typ_bezeichnung"
                        required
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {editingTitelTyp ? "Aktualisieren" : "Erstellen"}
                </button>
                {editingTitelTyp && (
                    <button
                        type="button"
                        onClick={() => setEditingTitelTyp(null)}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Abbrechen
                    </button>
                )}
            </Form>

            {/* Liste der Titel-Typen */}
            <ul className="space-y-4">
                {titelTypen.map((titelTyp) => (
                    <li key={titelTyp.titel_typ_id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <span>{titelTyp.titel_typ_bezeichnung}</span>
                        <div>
                            <button
                                onClick={() => setEditingTitelTyp(titelTyp.titel_typ_id)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                            >
                                Bearbeiten
                            </button>
                            <Form method="post" style={{ display: "inline" }}>
                                <input type="hidden" name="_action" value="delete" />
                                <input type="hidden" name="titel_typ_id" value={titelTyp.titel_typ_id} />
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={(e) => {
                                        if (!confirm("Sind Sie sicher, dass Sie diesen Titel-Typ löschen möchten?")) {
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
