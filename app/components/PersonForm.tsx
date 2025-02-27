import {Form} from "@remix-run/react";
import {useState} from "react";

export interface PersonFormProps {
    editingPerson: number | null;
    geschlechter: Array<{ geschlecht_id: string; geschlecht: string }>;
    telefonnummerTypen: Array<{ telefonnummer_typ_id: string; telefonnummer_typ: string }>;
    roles: Array<{ rolle_id: string; rolle_bezeichnung: string }>;
    statuses: Array<{ status_id: string; status_bezeichnung: string }>;
    titles: Array<{ titel_id: string; titel: string }>;
    onCancelEdit: () => void;
}

export default function PersonForm({
                                       editingPerson,
                                       geschlechter,
                                       telefonnummerTypen,
                                       roles,
                                       statuses,
                                       titles,
                                       onCancelEdit,
                                   }: PersonFormProps) {
    const [emails, setEmails] = useState<string[]>([""]);
    const [telefonnummern, setTelefonnummern] = useState<Array<{ nummer: string; typ: string }>>([{
        nummer: "",
        typ: "1"
    }]);
    const [personTitles, setPersonTitles] = useState<Array<{ titel_id: string }>>([{titel_id: ""}]);

    // E-Mail handlers
    const addEmail = () => setEmails([...emails, ""]);
    const removeEmail = (index: number) => setEmails(emails.filter((_, i) => i !== index));
    const updateEmail = (index: number, value: string) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    // Telefonnummer handlers
    const addTelefonnummer = () => setTelefonnummern([...telefonnummern, {nummer: "", typ: "1"}]);
    const removeTelefonnummer = (index: number) => setTelefonnummern(telefonnummern.filter((_, i) => i !== index));
    const updateTelefonnummer = (index: number, field: "nummer" | "typ", value: string) => {
        const newTelefonnummern = [...telefonnummern];
        newTelefonnummern[index][field] = value;
        setTelefonnummern(newTelefonnummern);
    };

    // Titel handlers
    const addTitle = () => setPersonTitles([...personTitles, {titel_id: ""}]);
    const removeTitle = (index: number) => setPersonTitles(personTitles.filter((_, i) => i !== index));
    const updateTitle = (index: number, value: string) => {
        const newTitles = [...personTitles];
        newTitles[index].titel_id = value;
        setPersonTitles(newTitles);
    };

    return (
        <Form method="post" className="mb-8 p-4 bg-gray-100 rounded">
            <input type="hidden" name="_action" value={editingPerson ? "update" : "create"}/>
            {editingPerson && <input type="hidden" name="person_id" value={editingPerson}/>}
            <div className="grid grid-cols-2 gap-4">
                {/* Basic person data */}
                <div>
                    <label htmlFor="vorname" className="block">Vorname*</label>
                    <input type="text" id="vorname" name="vorname" required className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="nachname" className="block">Nachname*</label>
                    <input type="text" id="nachname" name="nachname" required className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="geburtsdatum" className="block">Geburtsdatum</label>
                    <input type="date" id="geburtsdatum" name="geburtsdatum" className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="beitrittsdatum" className="block">Beitrittsdatum</label>
                    <input type="date" id="beitrittsdatum" name="beitrittsdatum" className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="geschlecht_id" className="block">Geschlecht*</label>
                    <select id="geschlecht_id" name="geschlecht_id" required className="w-full p-2 border rounded">
                        {geschlechter.map((g) => (
                            <option key={g.geschlecht_id} value={g.geschlecht_id}>
                                {g.geschlecht}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="mitgliedsnummer" className="block">Mitgliedsnummer</label>
                    <input type="number" id="mitgliedsnummer" name="mitgliedsnummer"
                           className="w-full p-2 border rounded" min="1" step="1"/>
                </div>
                <div>
                    <label htmlFor="schuetzenpassnummer" className="block">Schützenpassnummer</label>
                    <input type="number" id="schuetzenpassnummer" name="schuetzenpassnummer"
                           className="w-full p-2 border rounded" min="1" step="1"/>
                </div>
                <div>
                    <label htmlFor="strasse" className="block">Straße</label>
                    <input type="text" id="strasse" name="strasse" className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="plz" className="block">PLZ</label>
                    <input type="text" id="plz" name="plz" className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="ort" className="block">Ort</label>
                    <input type="text" id="ort" name="ort" className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="ist_landesverband_gemeldet" className="block">Beim Landesverband gemeldet?*</label>
                    <select id="ist_landesverband_gemeldet" name="ist_landesverband_gemeldet" required
                            className="w-full p-2 border rounded">
                        <option value="0">Nein</option>
                        <option value="1">Ja</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="hat_schluessel_suessenbrunn" className="block">Hat Schlüssel Süßenbrunn?*</label>
                    <select id="hat_schluessel_suessenbrunn" name="hat_schluessel_suessenbrunn" required
                            className="w-full p-2 border rounded">
                        <option value="0">Nein</option>
                        <option value="1">Ja</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="status_id" className="block">Status*</label>
                    <select id="status_id" name="status_id" required className="w-full p-2 border rounded">
                        {statuses.map((s) => (
                            <option key={s.status_id} value={s.status_id}>
                                {s.status_bezeichnung}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="rolle_id" className="block">Rolle*</label>
                    <select id="rolle_id" name="rolle_id" required className="w-full p-2 border rounded">
                        {roles.map((r) => (
                            <option key={r.rolle_id} value={r.rolle_id}>
                                {r.rolle_bezeichnung}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-span-2">
                    <label htmlFor="notiz" className="block">Notiz</label>
                    <textarea id="notiz" name="notiz" className="w-full p-2 border rounded" rows={4}></textarea>
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
                        {index > 0 && (
                            <button type="button" onClick={() => removeEmail(index)}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded">
                                Entfernen
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addEmail} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
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
                        {index > 0 && (
                            <button type="button" onClick={() => removeTelefonnummer(index)}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded">
                                Entfernen
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addTelefonnummer}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
                    Telefonnummer hinzufügen
                </button>
            </div>

            {/* Titel */}
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
                            <button type="button" onClick={() => removeTitle(index)}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded">
                                Entfernen
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addTitle} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
                    Titel hinzufügen
                </button>
            </div>

            <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                {editingPerson ? "Aktualisieren" : "Erstellen"}
            </button>
            {editingPerson && (
                <button type="button" onClick={onCancelEdit}
                        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Abbrechen
                </button>
            )}
        </Form>
    );
}
