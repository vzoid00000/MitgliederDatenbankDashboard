import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form, Link } from "@remix-run/react"
import { prisma } from "~/db.server"
import { useState } from "react"

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const titels = await prisma.titel.findMany()
    return json({ titels })
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const action = formData.get("_action")

    switch (action) {
        case "create":
        case "update":
            const titelId = formData.get("titel_id")
            const titelData = {
                titel: formData.get("titel") as string,
            }

            if (action === "create") {
                await prisma.titel.create({ data: titelData })
            } else {
                await prisma.titel.update({
                    where: { titel_id: Number.parseInt(titelId as string) },
                    data: titelData,
                })
            }
            break

        case "delete":
            const deleteId = formData.get("titel_id")
            await prisma.titel.delete({ where: { titel_id: Number.parseInt(deleteId as string) } })
            break
    }

    return null
}

export default function TitelList() {
    const { titels } = useLoaderData<typeof loader>()
    const [editingTitel, setEditingTitel] = useState<number | null>(null)

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Titelliste</h1>
            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
                Zurück zum Dashboard
            </Link>

            <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
                <input type="hidden" name="_action" value={editingTitel ? "update" : "create"} />
                {editingTitel && <input type="hidden" name="titel_id" value={editingTitel} />}
                <div>
                    <label htmlFor="titel" className="block">
                        Titel
                    </label>
                    <input type="text" id="titel" name="titel" required className="w-full p-2 border rounded" />
                </div>
                <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {editingTitel ? "Aktualisieren" : "Erstellen"}
                </button>
                {editingTitel && (
                    <button
                        type="button"
                        onClick={() => setEditingTitel(null)}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Abbrechen
                    </button>
                )}
            </Form>

            <ul className="space-y-4">
                {titels.map((titel) => (
                    <li key={titel.titel_id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <span>{titel.titel}</span>
                        <div>
                            <button
                                onClick={() => setEditingTitel(titel.titel_id)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                            >
                                Bearbeiten
                            </button>
                            <Form method="post" style={{ display: "inline" }}>
                                <input type="hidden" name="_action" value="delete" />
                                <input type="hidden" name="titel_id" value={titel.titel_id} />
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={(e) => {
                                        if (!confirm("Sind Sie sicher, dass Sie diesen Titel löschen möchten?")) {
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

