import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form, Link } from "@remix-run/react"
import { prisma } from "~/db.server"
import { useState } from "react"

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const telefonnummerTypen = await prisma.telefonnummer_typ.findMany()
    return json({ telefonnummerTypen })
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const action = formData.get("_action")

    switch (action) {
        case "create":
        case "update":
            const typId = formData.get("telefonnummer_typ_id")
            const typData = {
                telefonnummer_typ: formData.get("telefonnummer_typ") as string,
            }

            if (action === "create") {
                await prisma.telefonnummer_typ.create({ data: typData })
            } else {
                await prisma.telefonnummer_typ.update({
                    where: { telefonnummer_typ_id: Number.parseInt(typId as string) },
                    data: typData,
                })
            }
            break

        case "delete":
            const deleteId = formData.get("telefonnummer_typ_id")
            await prisma.telefonnummer_typ.delete({ where: { telefonnummer_typ_id: Number.parseInt(deleteId as string) } })
            break
    }

    return null
}

export default function TelefonnummertypList() {
    const { telefonnummerTypen } = useLoaderData<typeof loader>()
    const [editingTyp, setEditingTyp] = useState<number | null>(null)

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Telefonnummertypen</h1>
            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
                Zurück zum Dashboard
            </Link>

            <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
                <input type="hidden" name="_action" value={editingTyp ? "update" : "create"} />
                {editingTyp && <input type="hidden" name="telefonnummer_typ_id" value={editingTyp} />}
                <div>
                    <label htmlFor="telefonnummer_typ" className="block">
                        Telefonnummertyp
                    </label>
                    <input
                        type="text"
                        id="telefonnummer_typ"
                        name="telefonnummer_typ"
                        required
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {editingTyp ? "Aktualisieren" : "Erstellen"}
                </button>
                {editingTyp && (
                    <button
                        type="button"
                        onClick={() => setEditingTyp(null)}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Abbrechen
                    </button>
                )}
            </Form>

            <ul className="space-y-4">
                {telefonnummerTypen.map((typ) => (
                    <li key={typ.telefonnummer_typ_id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <span>{typ.telefonnummer_typ}</span>
                        <div>
                            <button
                                onClick={() => setEditingTyp(typ.telefonnummer_typ_id)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                            >
                                Bearbeiten
                            </button>
                            <Form method="post" style={{ display: "inline" }}>
                                <input type="hidden" name="_action" value="delete" />
                                <input type="hidden" name="telefonnummer_typ_id" value={typ.telefonnummer_typ_id} />
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={(e) => {
                                        if (!confirm("Sind Sie sicher, dass Sie diesen Telefonnummertyp löschen möchten?")) {
                                            e.preventDefault()
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
    )
}

