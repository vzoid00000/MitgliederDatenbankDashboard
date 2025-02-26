import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/db.server";

export const meta: MetaFunction = () => {
    return [
        { title: "Mitgliederdatenbank Dashboard" },
        { name: "description", content: "Mitgliederdatenbank" },
    ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const tables = [
        { name: "Person", count: await prisma.person.count() },
        { name: "Geschlecht", count: await prisma.geschlecht.count() },
        { name: "Status", count: await prisma.status.count() },
        { name: "Titel", count: await prisma.titel.count() },
        { name: "Telefonnummertyp", count: await prisma.telefonnummer_typ.count() },
        { name: "Rolle", count: await prisma.rolle.count() },
        { name: "Titeltyp", count: await prisma.titel_typ.count() },
    ];

    return json({ tables });
};

export default function Index() {
    const { tables } = useLoaderData<typeof loader>();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Mitgliederdatenbank Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                    <Link
                        key={table.name}
                        to={`/${table.name.toLowerCase()}`}
                        className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100"
                    >
                        <h2 className="text-xl font-bold">{table.name}</h2>
                        <p className="mt-2">Anzahl der Einträge: {table.count}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}