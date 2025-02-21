import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form, Link } from "@remix-run/react"
import { prisma } from "~/db.server"
import { useState } from "react"

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const statuses = await prisma.status.findMany()
    return json({ statuses })
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const action = formData.get("_action")

    switch (action) {
        case "create":
        case "update":
            const statusId = formData.get("status_id")
            const statusData = {
                status_bezeichnung: formData.get("status_bezeichnung") as string,
            }

            if (action === "create") {
                await prisma.status.create({ data: statusData })
            } else {
                await prisma.status.update({
                    where: { status_id: Number.parseInt(statusId as string) },
                    data: statusData,
                })
            }
            break

        case "delete":
            const deleteId = formData.get("status_id")
            await prisma.status.delete({ where: { status_id: Number.parseInt(deleteId as string) } })
            break
    }

    return null
}

export default function StatusList() {
    const { statuses } = useLoaderData<typeof loader>()
    const [editingStatus, setEditingStatus] = useState<number | null>(null)

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Statusliste</h1>
            <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
                Zurück zum Dashboard
            </Link>

            <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
                <input type="hidden" name="_action" value={editingStatus ? "update" : "create"} />
                {editingStatus && <input type="hidden" name="status_id" value={editingStatus} />}
                <div>
                    <label htmlFor="status_bezeichnung" className="block">
                        Status Bezeichnung
                    </label>
                    <input
                        type="text"
                        id="status_bezeichnung"
                        name="status_bezeichnung"
                        required
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {editingStatus ? "Aktualisieren" : "Erstellen"}
                </button>
                {editingStatus && (
                    <button
                        type="button"
                        onClick={() => setEditingStatus(null)}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Abbrechen
                    </button>
                )}
            </Form>

            <ul className="space-y-4">
                {statuses.map((status) => (
                    <li key={status.status_id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <span>{status.status_bezeichnung}</span>
                        <div>
                            <button
                                onClick={() => setEditingStatus(status.status_id)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                            >
                                Bearbeiten
                            </button>
                            <Form method="post" style={{ display: "inline" }}>
                                <input type="hidden" name="_action" value="delete" />
                                <input type="hidden" name="status_id" value={status.status_id} />
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={(e) => {
                                        if (!confirm("Sind Sie sicher, dass Sie diesen Status löschen möchten?")) {
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

