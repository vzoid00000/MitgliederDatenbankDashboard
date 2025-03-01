import React, { useEffect } from "react";
import { Form, Input, Button, DatePicker, Select, Checkbox } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { User, Phone, Mail, Award, MapPin, FileText } from "lucide-react";
import { useSubmit } from "@remix-run/react";

export interface PersonFormProps {
    editingPerson: number | null;
    geschlechter: Array<{ geschlecht_id: string; geschlecht: string }>;
    telefonnummerTypen: Array<{
        telefonnummer_typ_id: string;
        telefonnummer_typ: string;
    }>;
    roles: Array<{ rolle_id: string; rolle_bezeichnung: string }>;
    statuses: Array<{ status_id: string; status_bezeichnung: string }>;
    titles: Array<{ titel_id: string; titel: string }>;
    onCancelEdit: () => void;
}

export default function PersonForm({ editingPerson, geschlechter, telefonnummerTypen, roles, statuses, titles, onCancelEdit }: PersonFormProps) {
    const [form] = Form.useForm();
    const submit = useSubmit();

    // initial values for dynamic fields
    useEffect(() => {
        form.setFieldsValue({
            emails: [""],
            telefonnummern: [
                { nummer: "", typ: "" },
            ],
            titel_id: [""],
            ist_landesverband_gemeldet: false,
            hat_schluessel_suessenbrunn: false,
        });
    }, [form, telefonnummerTypen]);

    const onFinish = (values: any) => {

        if (values.geburtsdatum) {
            values.geburtsdatum = values.geburtsdatum.format("YYYY-MM-DD");
        }
        if (values.beitrittsdatum) {
            values.beitrittsdatum = values.beitrittsdatum.format("YYYY-MM-DD");
        }


        const formData = new FormData();

        formData.append("_action", editingPerson ? "update" : "create");
        if (editingPerson) {
            formData.append("person_id", editingPerson.toString());
        }

        // Append simple text fields
        [
            "vorname",
            "nachname",
            "geburtsdatum",
            "beitrittsdatum",
            "geschlecht_id",
            "mitgliedsnummer",
            "schuetzenpassnummer",
            "strasse",
            "plz",
            "ort",
            "status_id",
            "rolle_id",
            "notiz",
        ].forEach((field) => {
            if (values[field] !== undefined) {
                formData.append(field, values[field]);
            }
        });

        formData.append(
            "ist_landesverband_gemeldet",
            values.ist_landesverband_gemeldet ? "1" : "0"
        );
        formData.append(
            "hat_schluessel_suessenbrunn",
            values.hat_schluessel_suessenbrunn ? "1" : "0"
        );

        if (values.emails && Array.isArray(values.emails)) {
            // Filter: nur nicht-leere E-Mail-Adressen übernehmen
            const filteredEmails = values.emails.filter(
                (email: string) => email && email.trim() !== ""
            );
            filteredEmails.forEach((email) => {
                formData.append("emails[]", email);
            });
        }

        if (values.telefonnummern && Array.isArray(values.telefonnummern)) {
            values.telefonnummern.forEach((tel: any) => {
                // Prüfen, ob 'nummer' nicht leer ist
                if (tel.nummer && tel.nummer.trim() !== "") {
                    formData.append("telefonnummern[]", tel.nummer);
                    formData.append("telefonnummer_typen[]", tel.typ);
                }
            });
        }

        if (values.titel_id && Array.isArray(values.titel_id)) {
            values.titel_id.forEach((titel: string) => {
                formData.append("titel_id[]", titel);
            });
        }

        // Use Remix's submit to send the FormData (the action URL defaults to the current route)
        submit(formData, { method: "post" });
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2"
        >
            {/* Hidden Fields */}
            <Form.Item
                name="_action"
                initialValue={editingPerson ? "update" : "create"}
                style={{ display: "none" }}
            >
                <Input type="hidden" />
            </Form.Item>
            {editingPerson && (
                <Form.Item
                    name="person_id"
                    initialValue={editingPerson}
                    style={{ display: "none" }}
                >
                    <Input type="hidden" />
                </Form.Item>
            )}

            <div className="col-span-full mb-6">
                <h3 className="text-lg font-medium text-blue-800 flex items-center">
                    <User className="mr-2" size={18} />
                    Persönliche Daten
                </h3>
                <div className="h-0.5 bg-blue-100 mt-1" />
            </div>

            <Form.Item
                label="Vorname"
                name="vorname"
                rules={[{ required: true, message: "Bitte Vorname eingeben" }]}
            >
                <Input />
            </Form.Item>

            <Form.Item
                label="Nachname"
                name="nachname"
                rules={[{ required: true, message: "Bitte Nachname eingeben" }]}
            >
                <Input />
            </Form.Item>

            <Form.Item label="Geburtsdatum" name="geburtsdatum">
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
                label="Geschlecht"
                name="geschlecht_id"
                rules={[{ required: true, message: "Bitte Geschlecht auswählen" }]}
            >
                <Select>
                    {geschlechter.map((g) => (
                        <Select.Option key={g.geschlecht_id} value={g.geschlecht_id}>
                            {g.geschlecht}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <div className="col-span-full mt-6 mb-4">
                <h3 className="text-lg font-medium text-blue-800 flex items-center">
                    <Award className="mr-2" size={18} />
                    Mitgliedschaft
                </h3>
                <div className="h-0.5 bg-blue-100 mt-1" />
            </div>

            <Form.Item label="Mitgliedsnummer" name="mitgliedsnummer">
                <Input type="number" min={1} />
            </Form.Item>

            <Form.Item label="Schützenpassnummer" name="schuetzenpassnummer">
                <Input type="number" min={1} />
            </Form.Item>

            <Form.Item
                label="Status"
                name="status_id"
                rules={[{ required: true, message: "Bitte Status auswählen" }]}
            >
                <Select>
                    {statuses.map((s) => (
                        <Select.Option key={s.status_id} value={s.status_id}>
                            {s.status_bezeichnung}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Rolle"
                name="rolle_id"
                rules={[{ required: true, message: "Bitte Rolle auswählen" }]}
            >
                <Select>
                    {roles.map((r) => (
                        <Select.Option key={r.rolle_id} value={r.rolle_id}>
                            {r.rolle_bezeichnung}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item label="Beitrittsdatum" name="beitrittsdatum">
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <div className="col-span-full mt-6 mb-4">
                <h3 className="text-lg font-medium text-blue-800 flex items-center">
                    <MapPin className="mr-2" size={18} />
                    Adresse
                </h3>
                <div className="h-0.5 bg-blue-100 mt-1" />
            </div>

            <Form.Item label="Straße" name="strasse" className="col-span-full">
                <Input />
            </Form.Item>

            <Form.Item label="PLZ" name="plz">
                <Input />
            </Form.Item>

            <Form.Item label="Ort" name="ort">
                <Input />
            </Form.Item>

            <div className="col-span-full mt-6 mb-4">
                <h3 className="text-lg font-medium text-blue-800 flex items-center">
                    <Phone className="mr-2" size={18} />
                    Kontaktdaten
                </h3>
                <div className="h-0.5 bg-blue-100 mt-1" />
            </div>

            {/* Dynamic E-Mail Addresses */}
            <div className="col-span-full mb-4">
                <Form.List name="emails">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Mail className="mr-2" size={16} />
                                <span className="font-medium">E-Mail Adressen</span>
                            </div>
                            {fields.map((field) => (
                                <div key={field.key} className="flex items-center gap-2">
                                    <Form.Item
                                        {...field}
                                        className="mb-1 flex-grow"
                                        rules={[{ type: "email", message: "Ungültige E-Mail" }]}
                                    >
                                        <Input placeholder="E-Mail Adresse" />
                                    </Form.Item>
                                    {fields.length > 1 && (
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(field.name)}
                                            className="flex-shrink-0"
                                        />
                                    )}
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                icon={<PlusOutlined />}
                                className="w-full"
                            >
                                E-Mail hinzufügen
                            </Button>
                        </div>
                    )}
                </Form.List>
            </div>

            {/* Dynamic Phone Numbers */}
            <div className="col-span-full mb-4">
                <Form.List name="telefonnummern">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Phone className="mr-2" size={16} />
                                <span className="font-medium">Telefonnummern</span>
                            </div>
                            {fields.map((field) => (
                                <div key={field.key} className="flex items-center gap-2">
                                    {/* Telefonnummer-Feld */}
                                    <Form.Item
                                        {...field}
                                        name={[field.name, "nummer"]}
                                        fieldKey={[field.fieldKey, "nummer"]}
                                        className="mb-1 flex-grow"
                                    >
                                        <Input placeholder="Telefonnummer" />
                                    </Form.Item>

                                    {/* Typ-Feld mit bedingter Validierung */}
                                    <Form.Item
                                        {...field}
                                        name={[field.name, "typ"]}
                                        fieldKey={[field.fieldKey, "typ"]}
                                        className="mb-1 w-32"
                                        // Hier kommt die bedingte Validierung
                                        rules={[
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    // Hole den Wert der Telefonnummer aus demselben Index
                                                    const phoneNumber = getFieldValue([
                                                        "telefonnummern",
                                                        field.name,
                                                        "nummer",
                                                    ]);

                                                    // Wenn eine Telefonnummer eingetragen wurde, ist Typ required
                                                    if (phoneNumber && phoneNumber.trim() !== "") {
                                                        if (!value) {
                                                            return Promise.reject(
                                                                new Error("Bitte den Telefonnummer-Typ auswählen")
                                                            );
                                                        }
                                                    }

                                                    // Wenn Telefonnummer leer ist, kein Fehler
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                    >
                                        <Select placeholder="Typ auswählen" allowClear>
                                            {telefonnummerTypen.map((typ) => (
                                                <Select.Option
                                                    key={typ.telefonnummer_typ_id}
                                                    value={typ.telefonnummer_typ_id}
                                                >
                                                    {typ.telefonnummer_typ}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    {/* Entfernen-Button */}
                                    {fields.length > 1 && (
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(field.name)}
                                            className="flex-shrink-0"
                                        />
                                    )}
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                icon={<PlusOutlined />}
                                className="w-full"
                            >
                                Telefonnummer hinzufügen
                            </Button>
                        </div>
                    )}
                </Form.List>
            </div>

            {/* Dynamic Titles */}
            <div className="col-span-full mb-4">
                <Form.List name="titel_id">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <div key={field.key} className="flex items-center gap-2">
                  <span className="text-gray-600 w-40">
                    {index + 1}. Position des Titels:
                  </span>
                                    <Form.Item {...field} className="mb-1 flex-grow">
                                        <Select>
                                            <Select.Option value="">Keinen Titel</Select.Option>
                                            {titles.map((t) => (
                                                <Select.Option key={t.titel_id} value={t.titel_id}>
                                                    {t.titel}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    {fields.length > 1 && (
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(field.name)}
                                            className="flex-shrink-0"
                                        />
                                    )}
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                icon={<PlusOutlined />}
                                className="w-full"
                            >
                                Titel hinzufügen
                            </Button>
                        </div>
                    )}
                </Form.List>
            </div>

            <div className="col-span-full mt-6 mb-4">
                <h3 className="text-lg font-medium text-blue-800 flex items-center">
                    <FileText className="mr-2" size={18} />
                    Zusätzliche Informationen
                </h3>
                <div className="h-0.5 bg-blue-100 mt-1" />
            </div>

            <div className="col-span-full flex flex-col gap-2 mb-4">
                <Form.Item
                    name="ist_landesverband_gemeldet"
                    valuePropName="checked"
                    initialValue={false}
                    className="mb-1"
                >
                    <Checkbox>Beim Landesverband gemeldet?</Checkbox>
                </Form.Item>

                <Form.Item
                    name="hat_schluessel_suessenbrunn"
                    valuePropName="checked"
                    initialValue={false}
                    className="mb-1"
                >
                    <Checkbox>Hat Schlüssel Süßenbrunn?</Checkbox>
                </Form.Item>
            </div>

            <Form.Item label="Notiz" name="notiz" className="col-span-full">
                <Input.TextArea rows={4} />
            </Form.Item>

            <div className="col-span-full mt-6 flex justify-end gap-3">
                {editingPerson && (
                    <Button onClick={onCancelEdit} icon={<CloseOutlined />} size="large">
                        Abbrechen
                    </Button>
                )}
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                    {editingPerson ? "Aktualisieren" : "Erstellen"}
                </Button>
            </div>
        </Form>
    );
}
