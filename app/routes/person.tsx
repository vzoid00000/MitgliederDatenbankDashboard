import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const persons = await prisma.person.findMany({
        take: 10,
        include: {
            geschlecht: true,
            rolle: true,
            statuszeitraum: {
                orderBy: { von: 'desc' },
                take: 1, // aktueller Status (falls vorhanden)
                include: { status: true },
            },
            email_hat_person: { include: { email: true } },
            person_hat_telefonnummer: {
                include: { telefonnummer: { include: { telefonnummer_typ: true } } },
            },
        },
    });
    const geschlechter = await prisma.geschlecht.findMany();
    const telefonnummerTypen = await prisma.telefonnummer_typ.findMany();
    const roles = await prisma.rolle.findMany();
    const statuses = await prisma.status.findMany();
    return json({ persons, geschlechter, telefonnummerTypen, roles, statuses });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");

    const personData = {
        vorname: formData.get("vorname") as string,
        nachname: formData.get("nachname") as string,
        geburtsdatum: formData.get("geburtsdatum")
            ? new Date(formData.get("geburtsdatum") as string)
            : null,
        geschlecht_id: parseInt(formData.get("geschlecht_id") as string),
        rolle_id: parseInt(formData.get("rolle_id") as string),
        notiz: formData.get("notiz") as string,
        // Hier der angepasste Name:
        ist_landesverband_gemeldet: parseInt(
            formData.get("ist_landesverband_gemeldet") as string
        ),
        hat_schluessel_suessenbrunn: parseInt(
            formData.get("hat_schluessel_suessenbrunn") as string
        ),
        mitgliedsnummer: formData.get("mitgliedsnummer")
            ? parseInt(formData.get("mitgliedsnummer") as string)
            : null,
        schuetzenpassnummer: formData.get("schuetzenpassnummer")
            ? parseInt(formData.get("schuetzenpassnummer") as string)
            : null,
        strasse: formData.get("strasse") as string,
        ort: formData.get("ort") as string,
        plz: formData.get("plz") as string,
    };

    const emails = formData.getAll("emails[]").filter(Boolean) as string[];
    const telefonnummern = formData
        .getAll("telefonnummern[]")
        .filter(Boolean) as string[];
    const telefonnummerTypen = formData
        .getAll("telefonnummer_typen[]")
        .filter(Boolean) as string[];
    const status_id = parseInt(formData.get("status_id") as string);

    if (action === "create") {
        const newPerson = await prisma.person.create({
            data: {
                ...personData,
                email_hat_person: {
                    create: emails.map((email) => ({
                        email: {
                            connectOrCreate: {
                                where: { email_adresse: email },
                                create: { email_adresse: email },
                            },
                        },
                    })),
                },
                person_hat_telefonnummer: {
                    create: telefonnummern.map((telefonnummer, index) => ({
                        telefonnummer: {
                            create: {
                                telefonnummer: telefonnummer,
                                telefonnummer_typ_id: parseInt(telefonnummerTypen[index]),
                            },
                        },
                    })),
                },
            },
        });
        // Erstelle einen neuen Statuszeitraum-Eintrag
        await prisma.statuszeitraum.create({
            data: {
                person_id: newPerson.person_id,
                status_id: status_id,
                von: new Date(),
                bis: null,
            },
        });
    } else if (action === "update") {
        const personId = formData.get("person_id");
        await prisma.person.update({
            where: { person_id: parseInt(personId as string) },
            data: {
                ...personData,
                email_hat_person: {
                    deleteMany: {},
                    create: emails.map((email) => ({
                        email: {
                            connectOrCreate: {
                                where: { email_adresse: email },
                                create: { email_adresse: email },
                            },
                        },
                    })),
                },
                person_hat_telefonnummer: {
                    deleteMany: {},
                    create: telefonnummern.map((telefonnummer, index) => ({
                        telefonnummer: {
                            create: {
                                telefonnummer: telefonnummer,
                                telefonnummer_typ_id: parseInt(telefonnummerTypen[index]),
                            },
                        },
                    })),
                },
            },
        });
        // Aktualisiere den Status: Lösche vorhandene Einträge und erstelle einen neuen
        await prisma.statuszeitraum.deleteMany({
            where: { person_id: parseInt(personId as string) },
        });
        await prisma.statuszeitraum.create({
            data: {
                person_id: parseInt(personId as string),
                status_id: status_id,
                von: new Date(),
                bis: null,
            },
        });
    } else if (action === "delete") {
        const deleteId = formData.get("person_id");
        await prisma.person.delete({
            where: { person_id: parseInt(deleteId as string) },
        });
    }

    return null;
};

export default function PersonList() {
    const { persons, geschlechter, telefonnummerTypen, roles, statuses } =
        useLoaderData<typeof loader>();
    const [editingPerson, setEditingPerson] = useState<number | null>(null);
    const [emails, setEmails] = useState<string[]>([""]);
    const [telefonnummern, setTelefonnummern] = useState<
        Array<{ nummer: string; typ: string }>
    >([{ nummer: "", typ: "1" }]);

    const addEmail = () => setEmails([...emails, ""]);
    const removeEmail = (index: number) =>
        setEmails(emails.filter((_, i) => i !== index));
    const updateEmail = (index: number, value: string) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    const addTelefonnummer = () =>
        setTelefonnummern([...telefonnummern, { nummer: "", typ: "1" }]);
    const removeTelefonnummer = (index: number) =>
        setTelefonnummern(telefonnummern.filter((_, i) => i !== index));
    const updateTelefonnummer = (
        index: number,
        field: "nummer" | "typ",
        value: string
    ) => {
        const newTelefonnummern = [...telefonnummern];
        newTelefonnummern[index][field] = value;
        setTelefonnummern(newTelefonnummern);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Personenliste</h1>
            <Link
                to="/"
                className="text-blue-500 hover:underline mb-4 inline-block"
            >
                Zurück zum Dashboard
            </Link>

            <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
                <input
                    type="hidden"
                    name="_action"
                    value={editingPerson ? "update" : "create"}
                />
                {editingPerson && (
                    <input type="hidden" name="person_id" value={editingPerson} />
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="vorname" className="block">
                            Vorname*
                        </label>
                        <input
                            type="text"
                            id="vorname"
                            name="vorname"
                            required
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="nachname" className="block">
                            Nachname*
                        </label>
                        <input
                            type="text"
                            id="nachname"
                            name="nachname"
                            required
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="geburtsdatum" className="block">
                            Geburtsdatum
                        </label>
                        <input
                            type="date"
                            id="geburtsdatum"
                            name="geburtsdatum"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="geschlecht_id" className="block">
                            Geschlecht*
                        </label>
                        <select
                            id="geschlecht_id"
                            name="geschlecht_id"
                            required
                            className="w-full p-2 border rounded"
                        >
                            {geschlechter.map((g) => (
                                <option key={g.geschlecht_id} value={g.geschlecht_id}>
                                    {g.geschlecht}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="mitgliedsnummer" className="block">
                            Mitgliedsnummer
                        </label>
                        <input
                            type="number"
                            id="mitgliedsnummer"
                            name="mitgliedsnummer"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="schuetzenpassnummer" className="block">
                            Schützenpassnummer
                        </label>
                        <input
                            type="number"
                            id="schuetzenpassnummer"
                            name="schuetzenpassnummer"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="strasse" className="block">
                            Straße
                        </label>
                        <input
                            type="text"
                            id="strasse"
                            name="strasse"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="ort" className="block">
                            Ort
                        </label>
                        <input
                            type="text"
                            id="ort"
                            name="ort"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="plz" className="block">
                            PLZ
                        </label>
                        <input
                            type="text"
                            id="plz"
                            name="plz"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label htmlFor="ist_landesverband_gemeldet" className="block">
                            Beim Landesverband gemeldet?
                        </label>
                        <select
                            id="ist_landesverband_gemeldet"
                            name="ist_landesverband_gemeldet"
                            required
                            className="w-full p-2 border rounded"
                        >
                            <option value="0">Nein</option>
                            <option value="1">Ja</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="hat_schluessel_suessenbrunn" className="block">
                            Hat Schlüssel Süßenbrunn
                        </label>
                        <select
                            id="hat_schluessel_suessenbrunn"
                            name="hat_schluessel_suessenbrunn"
                            required
                            className="w-full p-2 border rounded"
                        >
                            <option value="0">Nein</option>
                            <option value="1">Ja</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status_id" className="block">
                            Status*
                        </label>
                        <select
                            id="status_id"
                            name="status_id"
                            required
                            className="w-full p-2 border rounded"
                        >
                            {statuses.map((s) => (
                                <option key={s.status_id} value={s.status_id}>
                                    {s.status_bezeichnung}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="rolle_id" className="block">
                            Rolle*
                        </label>
                        <select
                            id="rolle_id"
                            name="rolle_id"
                            required
                            className="w-full p-2 border rounded"
                        >
                            {roles.map((r) => (
                                <option key={r.rolle_id} value={r.rolle_id}>
                                    {r.rolle_bezeichnung}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label htmlFor="notiz" className="block">
                            Notiz
                        </label>
                        <textarea
                            id="notiz"
                            name="notiz"
                            className="w-full p-2 border rounded"
                            rows={4}
                        ></textarea>
                    </div>
                </div>

                {/* E-Mail Adressen */}
                <div className="mt-4">
                    <label className="block mb-2">E-Mail Adressen</label>
                    {emails.map((email, index) => (
                        <div key={index} className="flex mb-2">
                            <input
                                type="email"
                                name="emails[]"
                                value={email}
                                onChange={(e) => updateEmail(index, e.target.value)}
                                className="flex-grow p-2 border rounded"
                            />
                            {/* Entfernen-Button nur anzeigen, wenn index > 0 */}
                            {index > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeEmail(index)}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    Entfernen
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addEmail}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
                    >
                        E-Mail hinzufügen
                    </button>
                </div>

                {/* Telefonnummern */}
                <div className="mt-4">
                    <label className="block mb-2">Telefonnummern</label>
                    {telefonnummern.map((tel, index) => (
                        <div key={index} className="flex mb-2">
                            <input
                                type="tel"
                                name="telefonnummern[]"
                                value={tel.nummer}
                                onChange={(e) => updateTelefonnummer(index, "nummer", e.target.value)}
                                className="flex-grow p-2 border rounded"
                            />
                            <select
                                name="telefonnummer_typen[]"
                                value={tel.typ}
                                onChange={(e) => updateTelefonnummer(index, "typ", e.target.value)}
                                className="ml-2 p-2 border rounded"
                            >
                                {telefonnummerTypen.map((typ) => (
                                    <option key={typ.telefonnummer_typ_id} value={typ.telefonnummer_typ_id}>
                                        {typ.telefonnummer_typ}
                                    </option>
                                ))}
                            </select>
                            {/* Entfernen-Button nur anzeigen, wenn index > 0 */}
                            {index > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeTelefonnummer(index)}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    Entfernen
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addTelefonnummer}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
                    >
                        Telefonnummer hinzufügen
                    </button>
                </div>

                <button
                    type="submit"
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {editingPerson ? "Aktualisieren" : "Erstellen"}
                </button>
                {editingPerson && (
                    <button
                        type="button"
                        onClick={() => setEditingPerson(null)}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Abbrechen
                    </button>
                )}
            </Form>

            {/* Anzeige der Personenliste */}
            <ul className="space-y-4">
                {persons.map((person) => (
                    <li key={person.person_id} className="bg-white p-4 rounded shadow">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold">
                                {person.vorname} {person.nachname} ({person.geschlecht.geschlecht})
                            </h2>
                            <div>
                                <button
                                    onClick={() => setEditingPerson(person.person_id)}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                                >
                                    Bearbeiten
                                </button>
                                <Form method="post" style={{ display: "inline" }}>
                                    <input type="hidden" name="_action" value="delete" />
                                    <input type="hidden" name="person_id" value={person.person_id} />
                                    <button
                                        type="submit"
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                        onClick={(e) => {
                                            if (
                                                !confirm("Sind Sie sicher, dass Sie diese Person löschen möchten?")
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        Löschen
                                    </button>
                                </Form>
                            </div>
                        </div>
                        <p>
                            Geburtsdatum:{" "}
                            {person.geburtsdatum
                                ? new Date(person.geburtsdatum).toLocaleDateString()
                                : "N/A"}
                        </p>
                        <p>Mitgliedsnummer: {person.mitgliedsnummer || "N/A"}</p>
                        <p>Schützenpassnummer: {person.schuetzenpassnummer || "N/A"}</p>
                        <p>
                            Adresse: {person.strasse}, {person.plz} {person.ort}
                        </p>
                        <p>
                            Beim Landesverband gemeldet:{" "}
                            {person.ist_landesverband_gemeldet ? "Ja" : "Nein"}
                        </p>
                        <p>
                            Hat Schlüssel Süßenbrunn:{" "}
                            {person.hat_schluessel_suessenbrunn ? "Ja" : "Nein"}
                        </p>
                        <p>Rolle: {person.rolle.rolle_bezeichnung}</p>
                        <p>Notiz: {person.notiz || "N/A"}</p>
                        <div>
                            <strong>Status:</strong>
                            <ul>
                                {person.statuszeitraum.length > 0 ? (
                                    <li>{person.statuszeitraum[0].status.status_bezeichnung}</li>
                                ) : (
                                    <li>N/A</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <strong>E-Mail Adressen:</strong>
                            <ul>
                                {person.email_hat_person.map((ehp) => (
                                    <li key={ehp.email.email_id}>{ehp.email.email_adresse}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <strong>Telefonnummern:</strong>
                            <ul>
                                {person.person_hat_telefonnummer.map((pht) => (
                                    <li key={pht.telefonnummer.telefonnummer_id}>
                                        {pht.telefonnummer.telefonnummer} (
                                        {pht.telefonnummer.telefonnummer_typ.telefonnummer_typ})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
