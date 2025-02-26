import {json, LoaderFunctionArgs, ActionFunctionArgs} from "@remix-run/node";
import {useLoaderData, Form, Link} from "@remix-run/react";
import {prisma} from "~/db.server";
import {useState} from "react";
import {useActionData} from "react-router";
import {Prisma} from "@prisma/client";

export const loader = async ({request}: LoaderFunctionArgs) => {
    const persons = await prisma.person.findMany({
        take: 10,
        include: {
            geschlecht: true,
            rolle: true,
            status: true,
            person_hat_email: {include: {email: true}},
            person_hat_telefonnummer: {
                include: {telefonnummer: {include: {telefonnummer_typ: true}}},
            },
            person_hat_titel: {
                include: {
                    titel: {include: {titel_typ: true}}
                }
            },
            mitgliedschaftszeitraum: {
                orderBy: {von: 'desc'},
            },
        },
    });

    const geschlechter = await prisma.geschlecht.findMany();
    const telefonnummerTypen = await prisma.telefonnummer_typ.findMany();
    const roles = await prisma.rolle.findMany();
    const statuses = await prisma.status.findMany();
    const titles = await prisma.titel.findMany();
    return json({persons, geschlechter, telefonnummerTypen, roles, statuses, titles});
};


export const action = async ({request}: ActionFunctionArgs) => {
    try {
        const formData = await request.formData();
        const action = formData.get("_action");

        // Serverseitige Validierung der Mitgliedsnummer
        const mitgliedsnummerStr = formData.get("mitgliedsnummer");
        let mitgliedsnummer: number | null = null;
        if (mitgliedsnummerStr) {
            const parsed = parseInt(mitgliedsnummerStr as string, 10);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return json(
                    {error: "Mitgliedsnummer muss eine positive Ganzzahl größer als 0 sein."},
                    {status: 400}
                );
            }
            mitgliedsnummer = parsed;
        }

        // Serverseitige Validierung der Schützenpassnummer
        const schuetzenpassnummerStr = formData.get("schuetzenpassnummer");
        let schuetzenpassnummer: number | null = null;
        if (schuetzenpassnummerStr) {
            const parsed = parseInt(schuetzenpassnummerStr as string, 10);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return json(
                    {error: "Schützenpassnummer muss eine positive Ganzzahl größer als 0 sein."},
                    {status: 400}
                );
            }
            schuetzenpassnummer = parsed;
        }

        const personData = {
            vorname: formData.get("vorname") as string,
            nachname: formData.get("nachname") as string,
            geburtsdatum: formData.get("geburtsdatum")
                ? new Date(formData.get("geburtsdatum") as string)
                : null,
            geschlecht_id: parseInt(formData.get("geschlecht_id") as string),
            rolle_id: parseInt(formData.get("rolle_id") as string),
            status_id: parseInt(formData.get("status_id") as string),
            notiz: formData.get("notiz") as string,
            // Hier der angepasste Name:
            ist_landesverband_gemeldet: parseInt(
                formData.get("ist_landesverband_gemeldet") as string
            ),
            hat_schluessel_suessenbrunn: parseInt(
                formData.get("hat_schluessel_suessenbrunn") as string
            ),
            mitgliedsnummer,
            schuetzenpassnummer,
            strasse: formData.get("strasse") as string,
            ort: formData.get("ort") as string,
            plz: formData.get("plz") as string,
        };

        const emails = formData.getAll("emails[]").filter(Boolean) as string[];
        const telefonnummern = formData.getAll("telefonnummern[]").filter(Boolean) as string[];
        const telefonnummerTypen = formData.getAll("telefonnummer_typen[]").filter(Boolean) as string[];
        const status_id = parseInt(formData.get("status_id") as string);
        const titelIds = formData.getAll("titel_id[]").filter(Boolean) as string[];
        const reihenfolgen = formData.getAll("reihenfolge[]").filter(Boolean) as string[];

        if (action === "create") {
            const newPerson = await prisma.person.create({
                data: {
                    ...personData,
                    person_hat_email: {
                        create: emails.map((email) => ({
                            email: {
                                connectOrCreate: {
                                    where: {email_adresse: email},
                                    create: {email_adresse: email},
                                },
                            },
                        })),
                    },
                    person_hat_telefonnummer: {
                        create: telefonnummern.map((telefonnummer, index) => ({
                            telefonnummer: {
                                connectOrCreate: {
                                    where: {
                                        telefonnummer_telefonnummer_typ_id: {
                                            telefonnummer: telefonnummer,
                                            telefonnummer_typ_id: parseInt(telefonnummerTypen[index], 10),
                                        },
                                    },
                                    create: {
                                        telefonnummer: telefonnummer,
                                        telefonnummer_typ_id: parseInt(telefonnummerTypen[index], 10),
                                    },
                                },
                            },
                        })),
                    },
                    person_hat_titel: {
                        create: titelIds.map((titel_id, index) => ({
                            titel: {
                                connect: {titel_id: parseInt(titel_id, 10)},
                            },
                            reihenfolge: index + 1,
                        })),
                    },
                },
            });

            const beitrittsdatumStr = formData.get("beitrittsdatum") as string | null;
            let beitrittsdatum: Date | null = null;
            if (beitrittsdatumStr && beitrittsdatumStr.trim() !== "") {
                beitrittsdatum = new Date(beitrittsdatumStr);
            }

            if (beitrittsdatum) {
                await prisma.mitgliedschaftszeitraum.create({
                    data: {
                        von: beitrittsdatum,
                        bis: null,
                        person_id: newPerson.person_id,
                    },
                });
            }

            return json({success: "Person erfolgreich erstellt."});
        } else if (action === "update") {

            return json({success: "Person erfolgreich aktualisiert."});
        } else if (action === "delete") {
            const personId = parseInt(formData.get("person_id") as string, 10);

            // Zunächst alle zugehörigen E-Mail-IDs und Telefonnummer-IDs abrufen
            const personEmails = await prisma.person_hat_email.findMany({
                where: {person_id: personId},
                select: {email_id: true},
            });

            const personTelefonnummern = await prisma.person_hat_telefonnummer.findMany({
                where: {person_id: personId},
                select: {telefonnummer_id: true},
            });

            // Lösche die Join-Records für E-Mails und Telefonnummern
            await prisma.person_hat_email.deleteMany({
                where: {person_id: personId},
            });
            await prisma.person_hat_telefonnummer.deleteMany({
                where: {person_id: personId},
            });

            // Lösche die Person selbst
            await prisma.person.delete({
                where: {person_id: personId},
            });

            // Für jede E-Mail prüfen, ob noch andere Personen sie referenzieren.
            // Falls nicht, lösche auch den E-Mail-Datensatz.
            for (const {email_id} of personEmails) {
                const count = await prisma.person_hat_email.count({
                    where: {email_id},
                });
                if (count === 0) {
                    await prisma.email.delete({
                        where: {email_id},
                    });
                }
            }

            // Dasselbe für die Telefonnummern:
            for (const {telefonnummer_id} of personTelefonnummern) {
                const count = await prisma.person_hat_telefonnummer.count({
                    where: {telefonnummer_id},
                });
                if (count === 0) {
                    await prisma.telefonnummer.delete({
                        where: {telefonnummer_id},
                    });
                }
            }

            return json({success: "Person und zugehörige Daten erfolgreich gelöscht."});
        }


        return null;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            // Ermittele, welche Felder das Unique Constraint verletzt haben
            const target = (error.meta && error.meta.target) || [];
            let message = "Ein oder mehrere Felder sind bereits vergeben.";
            if (target.includes("mitgliedsnummer")) {
                message = "Die Mitgliedsnummer existiert bereits. Bitte wähle eine andere.";
            } else if (target.includes("schuetzenpassnummer")) {
                message = "Die Schützenpassnummer existiert bereits. Bitte wähle eine andere.";
            }
            return json({error: message}, {status: 400});
        }
        if (error instanceof Error) {
            return json({error: error.message}, {status: 400});
        }
        return json({error: "Unbekannter Fehler"}, {status: 400});
    }
};


export default function PersonList() {
    const {persons, geschlechter, telefonnummerTypen, roles, statuses, titles} = useLoaderData<typeof loader>();
    const actionData = useActionData<{ error?: string; success?: string }>();
    const [editingPerson, setEditingPerson] = useState<number | null>(null);
    const [emails, setEmails] = useState<string[]>([""]);
    const [telefonnummern, setTelefonnummern] = useState<Array<{ nummer: string; typ: string }>>([{
        nummer: "",
        typ: "1"
    }]);
    const [personTitles, setPersonTitles] = useState<Array<{ titel_id: string }>>([
        {titel_id: ""} // Standard: Kein Titel ausgewählt
    ]);

    const addTitle = () =>
        setPersonTitles([...personTitles, {titel_id: ""}]);

    const removeTitle = (index: number) =>
        setPersonTitles(personTitles.filter((_, i) => i !== index));

    const updateTitle = (index: number, value: string) => {
        const newTitles = [...personTitles];
        newTitles[index].titel_id = value;
        setPersonTitles(newTitles);
    };

    const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

    const addEmail = () => setEmails([...emails, ""]);
    const removeEmail = (index: number) =>
        setEmails(emails.filter((_, i) => i !== index));
    const updateEmail = (index: number, value: string) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    const addTelefonnummer = () =>
        setTelefonnummern([...telefonnummern, {nummer: "", typ: "1"}]);
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

            {/* Anzeige von Fehler- und Erfolgsmeldungen */}
            {actionData?.error && (
                <div className="mb-4 p-2 text-red-700 bg-red-100">
                    {actionData.error}
                </div>
            )}
            {actionData?.success && (
                <div className="mb-4 p-2 text-green-700 bg-green-100">
                    {actionData.success}
                </div>
            )}

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
                    <input type="hidden" name="person_id" value={editingPerson}/>
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
                        <label htmlFor="beitrittsdatum" className="block">Beitrittsdatum</label>
                        <input
                            type="date"
                            id="beitrittsdatum"
                            name="beitrittsdatum"
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
                            min="1"
                            step="1"
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
                            min="1"
                            step="1"
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
                        <label htmlFor="ist_landesverband_gemeldet" className="block">
                            Beim Landesverband gemeldet?*
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
                            Hat Schlüssel Süßenbrunn?*
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
                        <label htmlFor="status_id" className="block">Status*</label>
                        <select id="status_id" name="status_id" required className="w-full p-2 border rounded">
                            {statuses.map((s) => (
                                <option key={s.status_id} value={s.status_id}>{s.status_bezeichnung}</option>
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

                {/* Titel zuweisen */}
                <div className="mt-4">
                    <label className="block mb-2">Titel</label>
                    {personTitles.map((pt, index) => (
                        <div key={index} className="flex mb-2 items-center">
                            <span className="mr-2">{index + 1}. Position des Titels:</span>
                            <select
                                name="titel_id[]"
                                value={pt.titel_id}
                                onChange={(e) => updateTitle(index, e.target.value)}
                                className="flex-grow p-2 border rounded"
                            >
                                <option value="">Keinen Titel</option>
                                {titles.map((t) => (
                                    <option key={t.titel_id} value={t.titel_id}>
                                        {t.titel}
                                    </option>
                                ))}
                            </select>
                            {index > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeTitle(index)}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    Entfernen
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addTitle}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
                    >
                        Titel hinzufügen
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

            {/* Personenliste */}
            <ul className="space-y-4">
                {persons.map((person) => {
                    const isExpanded = expanded[person.person_id] || false;
                    const mitgliedschaft =
                        person.mitgliedschaftszeitraum && person.mitgliedschaftszeitraum.length > 0
                            ? person.mitgliedschaftszeitraum.find((m) => m.bis === null) || person.mitgliedschaftszeitraum[0]
                            : null;

                    const beforeTitles = person.person_hat_titel
                        .filter((pt) =>
                            pt.titel.titel_typ.titel_typ_bezeichnung.toLowerCase().includes("vor")
                        )
                        .sort((a, b) => a.reihenfolge - b.reihenfolge)
                        .map((pt) => pt.titel.titel);

                    const afterTitles = person.person_hat_titel
                        .filter((pt) =>
                            pt.titel.titel_typ.titel_typ_bezeichnung.toLowerCase().includes("nach")
                        )
                        .sort((a, b) => a.reihenfolge - b.reihenfolge)
                        .map((pt) => pt.titel.titel);

                    // Zusammensetzen des vollständigen Namens: Falls keine Titel vorhanden sind,
                    // entspricht fullName einfach dem normalen Vor- und Nachnamen.
                    const fullName = `${beforeTitles.join(" ")} ${person.vorname} ${person.nachname} ${afterTitles.join(" ")}`.trim();

                    return (
                        <li key={person.person_id} className="bg-white p-4 rounded shadow">
                            <div className="flex justify-between items-center">
                                <div>
                                    {/* In der kompakten Ansicht nur Vor- und Nachname */}
                                    <h2 className="text-xl font-bold">
                                        {person.vorname} {person.nachname}
                                    </h2>
                                    <p className="text-sm">
                                        <strong>Status:</strong> {person.status ? person.status.status_bezeichnung : "N/A"}
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setExpanded((prev) => ({
                                            ...prev,
                                            [person.person_id]: !prev[person.person_id],
                                        }))
                                    }
                                    className="text-blue-500 hover:underline"
                                >
                                    {isExpanded ? "Details ausblenden" : "Details anzeigen"}
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="mt-2 text-sm">
                                    <p>
                                        <strong>Geburtsdatum:</strong> {person.geburtsdatum ? new Date(person.geburtsdatum).toLocaleDateString() : "N/A"}
                                    </p>
                                    <p><strong>Mitgliedsnummer:</strong> {person.mitgliedsnummer || "N/A"}</p>
                                    <p><strong>Schützenpassnummer:</strong> {person.schuetzenpassnummer || "N/A"}</p>
                                    <p><strong>Straße:</strong> {person.strasse || "N/A"}</p>
                                    <p><strong>PLZ:</strong> {person.plz || "N/A"}</p>
                                    <p><strong>Ort:</strong> {person.ort || "N/A"}</p>
                                    <p><strong>Beim Landesverband
                                        gemeldet:</strong> {person.ist_landesverband_gemeldet ? "Ja" : "Nein"}</p>
                                    <p><strong>Hat Schlüssel
                                        Süßenbrunn:</strong> {person.hat_schluessel_suessenbrunn ? "Ja" : "Nein"}</p>
                                    <p><strong>Rolle:</strong> {person.rolle.rolle_bezeichnung}</p>
                                    <p><strong>Notiz:</strong> {person.notiz || "N/A"}</p>
                                    {mitgliedschaft && (
                                        <div>
                                            <p>
                                                <strong>Beitrittsdatum:</strong> {mitgliedschaft.von ? new Date(mitgliedschaft.von).toLocaleDateString() : "N/A"}
                                            </p>
                                            <p>
                                                <strong>Austrittsdatum:</strong> {mitgliedschaft.bis ? new Date(mitgliedschaft.bis).toLocaleDateString() : "N/A"}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <strong>E-Mail Adressen:</strong>
                                        <ul>
                                            {person.person_hat_email.map((phe) => (
                                                <li key={phe.email.email_id}>{phe.email.email_adresse}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>Telefonnummern:</strong>
                                        <ul>
                                            {person.person_hat_telefonnummer.map((pht) => (
                                                <li key={pht.telefonnummer.telefonnummer_id}>
                                                    {pht.telefonnummer.telefonnummer} (<strong>{pht.telefonnummer.telefonnummer_typ.telefonnummer_typ}</strong>)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {/* Der vollständige Name mit Titeln wird immer angezeigt */}
                                    <div className="mt-2 text-xs text-gray-600">
                                        <strong>Vollständiger Name:</strong> {fullName}
                                    </div>
                                    {/* Delete-Button */}
                                    <Form
                                        method="post"
                                        onSubmit={(e) => {
                                            if (!confirm("Wollen Sie diese Person wirklich löschen?")) {
                                                e.preventDefault();
                                            }
                                        }}
                                        className="mt-4"
                                    >
                                        <input type="hidden" name="_action" value="delete"/>
                                        <input type="hidden" name="person_id" value={person.person_id}/>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            Löschen
                                        </button>
                                    </Form>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
