import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form, Link } from "@remix-run/react"
import { prisma } from "~/db.server"
import { useState } from "react"

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const geschlechter = await prisma.geschlecht.findMany()
    return json({ geschlechter })
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const action = formData.get("_action")

    switch (action) {
        case "create":
        case "update":
            const geschlechtId = formData.get("geschlecht_id")
            const geschlechtData = {
                geschlecht: formData.get("geschlecht") as string,
            }

            if (action === "create") {
                await prisma.geschlecht.create({ data: geschlechtData })
            } else {
                await prisma.geschlecht.update({
                    where: { geschlecht_id: Number.parseInt(geschlechtId as string) },
                    data: geschlechtData,
                })
            }
            break

        case "delete":
            const deleteId = formData.get("geschlecht_id")
            await prisma.geschlecht.delete({ where: { geschlecht_id: Number.parseInt(deleteId as string) } })
            break
    }

    return null
}

export default function GeschlechtList() {
    const { geschlechter } = useLoaderData<typeof loader>()
    const [editingGeschlecht, setEditingGeschlecht] = useState<number | null>(null)

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Geschlechterliste</h1>
            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
                Zurück zum Dashboard
            </Link>

            <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
                <input type="hidden" name="_action" value={editingGeschlecht ? "update" : "create"} />
                {editingGeschlecht && <input type="hidden" name="geschlecht_id" value={editingGeschlecht} />}
                <div>
                    <label htmlFor="geschlecht" className="block">
                        Geschlecht
                    </label>
                    <input type="text" id="geschlecht" name="geschlecht" required className="w-full p-2 border rounded" />
                </div>
                <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {editingGeschlecht ? "Aktualisieren" : "Erstellen"}
                </button>
                {editingGeschlecht && (
                    <button
                        type="button"
                        onClick={() => setEditingGeschlecht(null)}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Abbrechen
                    </button>
                )}
            </Form>

            <ul className="space-y-4">
                {geschlechter.map((geschlecht) => (
                    <li key={geschlecht.geschlecht_id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <span>{geschlecht.geschlecht}</span>
                        <div>
                            <button
                                onClick={() => setEditingGeschlecht(geschlecht.geschlecht_id)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                            >
                                Bearbeiten
                            </button>
                            <Form method="post" style={{ display: "inline" }}>
                                <input type="hidden" name="_action" value="delete" />
                                <input type="hidden" name="geschlecht_id" value={geschlecht.geschlecht_id} />
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={(e) => {
                                        if (!confirm("Sind Sie sicher, dass Sie dieses Geschlecht löschen möchten?")) {
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

