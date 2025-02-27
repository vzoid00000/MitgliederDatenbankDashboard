import { Form } from "@remix-run/react";
import { useState } from "react";

export interface PersonListItemProps {
    person: any;
}

export default function PersonListItem({ person }: PersonListItemProps) {
    const [expanded, setExpanded] = useState(false);

    const mitgliedschaft =
        person.mitgliedschaftszeitraum && person.mitgliedschaftszeitraum.length > 0
            ? person.mitgliedschaftszeitraum.find((m: any) => m.bis === null) || person.mitgliedschaftszeitraum[0]
            : null;

    const beforeTitles = person.person_hat_titel
        .filter((pt: any) => pt.titel.titel_typ.titel_typ_bezeichnung.toLowerCase().includes("vor"))
        .sort((a: any, b: any) => a.reihenfolge - b.reihenfolge)
        .map((pt: any) => pt.titel.titel);

    const afterTitles = person.person_hat_titel
        .filter((pt: any) => pt.titel.titel_typ.titel_typ_bezeichnung.toLowerCase().includes("nach"))
        .sort((a: any, b: any) => a.reihenfolge - b.reihenfolge)
        .map((pt: any) => pt.titel.titel);

    const fullName = `${beforeTitles.join(" ")} ${person.vorname} ${person.nachname} ${afterTitles.join(" ")}`.trim();

    return (
        <li className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">
                        {person.vorname} {person.nachname}
                    </h2>
                    <p className="text-sm">
                        <strong>Status:</strong> {person.status ? person.status.status_bezeichnung : "N/A"}
                    </p>
                </div>
                <button onClick={() => setExpanded(!expanded)} className="text-blue-500 hover:underline">
                    {expanded ? "Details ausblenden" : "Details anzeigen"}
                </button>
            </div>
            {expanded && (
                <div className="mt-2 text-sm">
                    <p>
                        <strong>Geburtsdatum:</strong>{" "}
                        {person.geburtsdatum ? new Date(person.geburtsdatum).toLocaleDateString() : "N/A"}
                    </p>
                    <p>
                        <strong>Mitgliedsnummer:</strong> {person.mitgliedsnummer || "N/A"}
                    </p>
                    <p>
                        <strong>Schützenpassnummer:</strong> {person.schuetzenpassnummer || "N/A"}
                    </p>
                    <p>
                        <strong>Straße:</strong> {person.strasse || "N/A"}
                    </p>
                    <p>
                        <strong>PLZ:</strong> {person.plz || "N/A"}
                    </p>
                    <p>
                        <strong>Ort:</strong> {person.ort || "N/A"}
                    </p>
                    <p>
                        <strong>Beim Landesverband gemeldet:</strong> {person.ist_landesverband_gemeldet ? "Ja" : "Nein"}
                    </p>
                    <p>
                        <strong>Hat Schlüssel Süßenbrunn:</strong> {person.hat_schluessel_suessenbrunn ? "Ja" : "Nein"}
                    </p>
                    <p>
                        <strong>Rolle:</strong> {person.rolle.rolle_bezeichnung}
                    </p>
                    <p>
                        <strong>Notiz:</strong> {person.notiz || "N/A"}
                    </p>
                    {mitgliedschaft && (
                        <div>
                            <p>
                                <strong>Beitrittsdatum:</strong>{" "}
                                {mitgliedschaft.von ? new Date(mitgliedschaft.von).toLocaleDateString() : "N/A"}
                            </p>
                            <p>
                                <strong>Austrittsdatum:</strong>{" "}
                                {mitgliedschaft.bis ? new Date(mitgliedschaft.bis).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    )}
                    <div>
                        <strong>E-Mail Adressen:</strong>
                        <ul>
                            {person.person_hat_email.map((phe: any) => (
                                <li key={phe.email.email_id}>{phe.email.email_adresse}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <strong>Telefonnummern:</strong>
                        <ul>
                            {person.person_hat_telefonnummer.map((pht: any) => (
                                <li key={pht.telefonnummer.telefonnummer_id}>
                                    {pht.telefonnummer.telefonnummer} (
                                    <strong>{pht.telefonnummer.telefonnummer_typ.telefonnummer_typ}</strong>)
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                        <strong>Vollständiger Name:</strong> {fullName}
                    </div>
                    <Form
                        method="post"
                        onSubmit={(e) => {
                            if (!confirm("Wollen Sie diese Person wirklich löschen?")) {
                                e.preventDefault();
                            }
                        }}
                        className="mt-4"
                    >
                        <input type="hidden" name="_action" value="delete" />
                        <input type="hidden" name="person_id" value={person.person_id} />
                        <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                            Löschen
                        </button>
                    </Form>
                </div>
            )}
        </li>
    );
}
