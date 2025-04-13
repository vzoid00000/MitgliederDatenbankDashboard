// app/routes/person.tsx
import React, { useState } from 'react';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { Layout, Card, Input, Table, Button, Space, Tag, Avatar, Drawer, Form, Select, DatePicker, Typography, Tooltip, Popconfirm, message, Steps, Progress, Checkbox, Modal } from 'antd';
import {SearchOutlined, UserAddOutlined, FilterOutlined, UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { prisma } from '~/db.server';

const { Content } = Layout;
const { Title, Text } = Typography;

export async function loader() {
    const persons = await prisma.person.findMany({
        include: {
            geschlecht: true,
            person_hat_status: { include: { status: true } },
            person_hat_rolle: { include: { rolle: true } },
            person_hat_email: { include: { email: true } },
            person_hat_telefonnummer: { include: { telefonnummer: { include: { telefonnummer_typ: true } } } },
            person_hat_titel: { include: { titel: true } },
        },
    });
    const status = await prisma.status.findMany();
    const rollen = await prisma.rolle.findMany();
    const geschlechter = await prisma.geschlecht.findMany();
    const telefontypen = await prisma.telefonnummer_typ.findMany();
    const titels = await prisma.titel.findMany({ include: { titel_typ: true } });

    return json({ persons, status, rollen, geschlechter, telefontypen, titels });
}

export async function action({ request }: { request: Request }) {
    const formData = await request.formData();
    const actionType = formData.get("_action");

    if (actionType === "delete") {
        const deleteId = formData.get("person_id");
        if (!deleteId) {
            return json({ error: "Keine Person ID angegeben" }, { status: 400 });
        }
        try {
            await prisma.person.delete({ where: { person_id: Number(deleteId) } });
            return json({ result: "deleted" });
        } catch (error) {
            console.error("Error deleting person:", error);
            return json({ error: "Fehler beim Löschen der Person" }, { status: 500 });
        }
    }


    // Helper-Funktionen zur Datenbereinigung (wie zuvor)
    const getSafeValue = (field: FormDataEntryValue | null): string | undefined => {
        if (!field || field === "undefined") return undefined;
        return field.toString();
    };
    const getSafeDate = (field: FormDataEntryValue | null): Date | undefined => {
        const val = getSafeValue(field);
        if (!val) return undefined;
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
    };
    const getSafeNumber = (field: FormDataEntryValue | null): number | undefined => {
        const val = getSafeValue(field);
        if (!val) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
    };

    // Einzelne Felder bereinigen
    const vorname = getSafeValue(formData.get('vorname'));
    const nachname = getSafeValue(formData.get('nachname'));
    const geburtsdatum = getSafeDate(formData.get('geburtsdatum'));
    const geschlechtStr = getSafeValue(formData.get('geschlecht'));
    const mitgliedsnummer = getSafeNumber(formData.get('mitgliedsnummer'));
    const schuetzenpassnummer = getSafeNumber(formData.get('schuetzenpassnummer'));
    const strasse = getSafeValue(formData.get('strasse'));
    const ort = getSafeValue(formData.get('ort'));
    const plz = getSafeValue(formData.get('plz'));
    const email = getSafeValue(formData.get('email')) || null;
    const phone = getSafeValue(formData.get('telefon')) || null;
    // Wir entfernen hier den Fallback auf 'privat', damit wir wirklich den Fehler erkennen
    const telefon_typ = getSafeValue(formData.get('telefon_typ'));
    const ist_landesverband_gemeldet = formData.get('ist_landesverband_gemeldet') === 'on' ? 1 : 0;
    const hat_schluessel_suessenbrunn = formData.get('hat_schluessel_suessenbrunn') === 'on' ? 1 : 0;
    const notiz = getSafeValue(formData.get('notiz')) || null;

    // Arrays bereinigen
    const safeTitels = (formData.getAll('titel') as FormDataEntryValue[])
        .map(getSafeValue)
        .filter((t): t is string => t !== undefined);
    const safeStatuses = (formData.getAll('status') as FormDataEntryValue[])
        .map(getSafeValue)
        .filter((s): s is string => s !== undefined);
    const safeRoles = (formData.getAll('rolle') as FormDataEntryValue[])
        .map(getSafeValue)
        .filter((r): r is string => r !== undefined);

    // Pflichtfelder prüfen
    if (!vorname || !nachname || !geschlechtStr) {
        return json({ error: 'Bitte alle Pflichtfelder ausfüllen.' }, { status: 400 });
    }

    // Falls eine Telefonnummer eingegeben wurde, muss auch ein Telefontyp angegeben sein
    if (phone && !telefon_typ) {
        return json(
            { error: 'Wenn eine Telefonnummer eingegeben wird, muss auch ein Telefontyp ausgewählt werden.' },
            { status: 400 }
        );
    }

    // Gültiges Geschlecht ermitteln
    const geschlechtRecord = await prisma.geschlecht.findUnique({
        where: { geschlecht: geschlechtStr as string },
    });
    if (!geschlechtRecord) {
        return json({ error: 'Ungültiges Geschlecht' }, { status: 400 });
    }

    // Telefontyp-Datensatz ermitteln oder erstellen
    let phoneTypeRecord;
    if (telefon_typ) {
        phoneTypeRecord = await prisma.telefonnummer_typ.findUnique({
            where: { telefonnummer_typ: telefon_typ },
        });
        if (!phoneTypeRecord) {
            phoneTypeRecord = await prisma.telefonnummer_typ.create({
                data: { telefonnummer_typ: telefon_typ },
            });
        }
    }
    const phoneTypeId = phoneTypeRecord?.telefonnummer_typ_id;

    // Neue Person erstellen – nur verschachtelte Blöcke einfügen, wenn entsprechende Werte vorhanden sind
    const newPerson = await prisma.person.create({
        data: {
            vorname: vorname as string,
            nachname: nachname as string,
            ...(geburtsdatum ? { geburtsdatum } : {}),
            ...(mitgliedsnummer !== undefined ? { mitgliedsnummer } : {}),
            ...(schuetzenpassnummer !== undefined ? { schuetzenpassnummer } : {}),
            ...(strasse ? { strasse } : {}),
            ...(ort ? { ort } : {}),
            ...(plz ? { plz } : {}),
            geschlecht_id: geschlechtRecord.geschlecht_id,
            ist_landesverband_gemeldet,
            hat_schluessel_suessenbrunn,
            notiz,
            username: `${vorname}${nachname}`,
            person_hat_email: email
                ? {
                    create: [
                        {
                            email: {
                                connectOrCreate: {
                                    where: { email_adresse: email },
                                    create: { email_adresse: email },
                                },
                            },
                        },
                    ],
                }
                : undefined,
            person_hat_telefonnummer: phone
                ? {
                    create: [
                        {
                            telefonnummer: {
                                create: {
                                    telefonnummer: phone,
                                    // Telefon-Typ nur übergeben, wenn vorhanden
                                    ...(phoneTypeId ? { telefonnummer_typ_id: phoneTypeId } : {}),
                                },
                            },
                        },
                    ],
                }
                : undefined,
            person_hat_status: safeStatuses.length > 0
                ? {
                    create: safeStatuses.map((s) => ({
                        status: { connect: { status_bezeichnung: s } },
                    })),
                }
                : undefined,
            person_hat_rolle: safeRoles.length > 0
                ? {
                    create: safeRoles.map((r) => ({
                        rolle: { connect: { rolle_bezeichnung: r } },
                    })),
                }
                : undefined,
            person_hat_titel: safeTitels.length > 0
                ? {
                    create: safeTitels.map((t) => ({
                        titel: { connect: { titel: t } },
                        reihenfolge: 1,
                    })),
                }
                : undefined,
        },
        include: {
            person_hat_status: true,
            person_hat_rolle: true,
            person_hat_email: { include: { email: true } },
            person_hat_telefonnummer: { include: { telefonnummer: true } },
            person_hat_titel: { include: { titel: true } },
        },
    });

    return redirect('/person');
}


function App() {
    const {
        persons,
        status: statusOptions,
        rollen: roleOptions,
        geschlechter,
        telefontypen,
        titels,
    } = useLoaderData();
    const fetcher = useFetcher();
    const [personDrawerVisible, setPersonDrawerVisible] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<any>(null);
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [formProgress, setFormProgress] = useState(0);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<any>(null);

    const handleEdit = (record: any) => {
        setSelectedPerson(record);
        form.setFieldsValue({
            ...record,
            status: record.person_hat_status?.map(
                (item: any) => item.status.status_bezeichnung
            ),
            rolle: record.person_hat_rolle?.map(
                (item: any) => item.rolle.rolle_bezeichnung
            ),
            geschlecht: record.geschlecht,
            email: record.person_hat_email?.[0]?.email?.email_adresse,
            telefon: record.person_hat_telefonnummer?.[0]?.telefonnummer?.telefonnummer,
        });
        setPersonDrawerVisible(true);
    };

    // Statt eines Popconfirms verwenden wir nun diesen Aufruf, um das Lösch-Modal zu triggern
    const handleDelete = (record: any) => {
        setPersonToDelete(record);
        setDeleteModalVisible(true);
    };

    const updateFormProgress = () => {
        const values = form.getFieldsValue();
        const requiredFields = ["vorname", "nachname", "geschlecht"];
        const filledFields = requiredFields.filter((field) => values[field]);
        setFormProgress(Math.round((filledFields.length / requiredFields.length) * 100));
    };

    const handleSubmit = (values: any) => {
        if (values.geburtsdatum) {
            values.geburtsdatum = values.geburtsdatum.format("YYYY-MM-DD");
        }
        fetcher.submit(values, { method: "post" });
        message.success("Neue Person wurde erstellt!");
        setPersonDrawerVisible(false);
        form.resetFields();
        setCurrentStep(0);
    };

    const getAvatarBg = (geschlecht: string | undefined) => {
        if (geschlecht) {
            const lower = geschlecht.toLowerCase();
            if (lower.startsWith("m")) return "bg-blue-500";
            if (lower.startsWith("w")) return "bg-pink-500";
        }
        return "bg-gray-500";
    };

    const columns = [
        {
            title: "Mitglied",
            key: "member",
            render: (text: string, record: any) => {
                const genderValue = record.geschlecht?.geschlecht;
                const avatarBg = getAvatarBg(genderValue);
                return (
                    <Space>
                        <Avatar icon={<UserOutlined />} className={avatarBg} />
                        <div>
                            <div className="font-medium">{`${record.vorname} ${record.nachname}`}</div>
                            <Text type="secondary" className="text-sm">
                                #{record.mitgliedsnummer}
                            </Text>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: "Status",
            key: "status",
            render: (_: any, record: any) => {
                const statuses =
                    record.person_hat_status?.map(
                        (item: any) => item.status.status_bezeichnung
                    ) || [];
                return (
                    <Space size={[0, 4]} wrap>
                        {statuses.map((status: string) => (
                            <Tag color={status === "Aktiv" ? "success" : "blue"} key={status}>
                                {status}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: "Kontakt",
            key: "contact",
            render: (text: string, record: any) => {
                const phoneRecord = record.person_hat_telefonnummer?.[0]?.telefonnummer;
                return (
                    <Space direction="vertical" size="small">
                        <Space>
                            <MailOutlined className="text-gray-400" />
                            <Text>{record.person_hat_email?.[0]?.email?.email_adresse}</Text>
                        </Space>
                        <Space>
                            <PhoneOutlined className="text-gray-400" />
                            <Text>{phoneRecord?.telefonnummer}</Text>
                            {phoneRecord?.telefonnummer_typ && (
                                <Text type="secondary" style={{ marginLeft: 8 }}>
                                    ({phoneRecord.telefonnummer_typ.telefonnummer_typ})
                                </Text>
                            )}
                        </Space>
                    </Space>
                );
            },
        },
        {
            title: "Rollen",
            key: "rolle",
            render: (_: any, record: any) => {
                const roles =
                    record.person_hat_rolle?.map(
                        (item: any) => item.rolle.rolle_bezeichnung
                    ) || [];
                return (
                    <Space size={[0, 4]} wrap>
                        {roles.map((rolle: string) => (
                            <Tag color="purple" key={rolle}>
                                {rolle}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Aktionen',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="Bearbeiten">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            style={{ color: '#1890ff' }}
                            onClick={() => handleEdit(record)}
                        >
                            Bearbeiten
                        </Button>
                    </Tooltip>
                    <Tooltip title="Löschen">
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        >
                            Löschen
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Layout className="min-h-screen bg-gray-50">
            <Content className="p-6">
                {/* Header Card */}
                <Card className="mb-6 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <Title level={3} className="mb-1">
                                Mitgliederverwaltung
                            </Title>
                            <Text type="secondary">
                                Verwalten Sie alle Mitglieder und deren Informationen
                            </Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            size="large"
                            onClick={() => {
                                setSelectedPerson(null);
                                form.resetFields();
                                setPersonDrawerVisible(true);
                                setCurrentStep(0);
                            }}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            Neues Mitglied
                        </Button>
                    </div>
                </Card>

                {/* Search and Filter Card */}
                <Card className="mb-6 shadow-sm">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: "Nach Name suchen...", value: "name", prefix: <UserOutlined /> },
                                { label: "Nach Mitgliedsnummer suchen...", value: "number", prefix: <InfoCircleOutlined /> },
                                { label: "Nach Email suchen...", value: "email", prefix: <MailOutlined /> },
                            ].map((option) => (
                                <Input
                                    key={option.value}
                                    placeholder={option.label}
                                    prefix={option.prefix}
                                    className="w-full"
                                    allowClear
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Text strong className="mb-2 block">
                                    Status Filter
                                </Text>
                                <Select mode="multiple" placeholder="Status auswählen" className="w-full" allowClear maxTagCount={3}>
                                    {statusOptions.map((s: any) => (
                                        <Select.Option key={s.status_id} value={s.status_bezeichnung}>
                                            {s.status_bezeichnung}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Text strong className="mb-2 block">
                                    Rollen Filter
                                </Text>
                                <Select mode="multiple" placeholder="Rollen auswählen" className="w-full" allowClear maxTagCount={3}>
                                    {roleOptions.map((r: any) => (
                                        <Select.Option key={r.rolle_id} value={r.rolle_bezeichnung}>
                                            {r.rolle_bezeichnung}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Members Table Card */}
                <Card className="shadow-sm">
                    <Table
                        dataSource={persons}
                        columns={columns}
                        rowKey="person_id"
                        pagination={{
                            total: persons.length,
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                        }}
                    />
                </Card>

                {/* Add/Edit Person Drawer */}
                <Drawer
                    title={
                        <div className="flex items-center justify-between w-full pr-8">
                            <div className="flex items-center gap-2">
                                {selectedPerson ? (
                                    <>
                                        <EditOutlined className="text-blue-500" />
                                        <span>Mitglied bearbeiten</span>
                                    </>
                                ) : (
                                    <>
                                        <UserAddOutlined className="text-green-500" />
                                        <span>Neues Mitglied hinzufügen</span>
                                    </>
                                )}
                            </div>
                            <Progress
                                type="circle"
                                percent={formProgress}
                                width={40}
                                format={(percent) => <span className="text-xs">{percent}%</span>}
                            />
                        </div>
                    }
                    placement="right"
                    onClose={() => {
                        setPersonDrawerVisible(false);
                        setSelectedPerson(null);
                        form.resetFields();
                        setFormProgress(0);
                    }}
                    open={personDrawerVisible}
                    width={800}
                    className="member-form-drawer"
                >
                    <Steps
                        current={currentStep}
                        onChange={setCurrentStep}
                        items={[
                            { title: "Persönlich", icon: <UserOutlined /> },
                            { title: "Kontakt", icon: <PhoneOutlined /> },
                            { title: "Mitgliedschaft", icon: <HomeOutlined /> },
                        ]}
                        className="mb-8"
                    />

                    <Form form={form} layout="vertical" className="space-y-4" onValuesChange={updateFormProgress} onFinish={handleSubmit}>
                        {/* Schritt 0: Persönliche Informationen */}
                        <div className={currentStep === 0 ? "block" : "hidden"}>
                            <Card title="Persönliche Informationen" className="mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Form.Item
                                        label="Vorname"
                                        name="vorname"
                                        rules={[{ required: true, message: "Bitte geben Sie einen Vornamen ein" }]}
                                        tooltip="Der Vorname des Mitglieds"
                                    >
                                        <Input placeholder="z.B. Max" />
                                    </Form.Item>
                                    <Form.Item
                                        label="Nachname"
                                        name="nachname"
                                        rules={[{ required: true, message: "Bitte geben Sie einen Nachnamen ein" }]}
                                        tooltip="Der Nachname des Mitglieds"
                                    >
                                        <Input placeholder="z.B. Mustermann" />
                                    </Form.Item>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Form.Item
                                        label="Geburtsdatum"
                                        name="geburtsdatum"
                                        tooltip="Das Geburtsdatum wird für Altersgruppen und Statistiken verwendet"
                                    >
                                        <DatePicker className="w-full" placeholder="Wählen Sie ein Datum" />
                                    </Form.Item>
                                    <Form.Item
                                        label="Geschlecht"
                                        name="geschlecht"
                                        rules={[{ required: true, message: "Bitte wählen Sie ein Geschlecht aus." }]}
                                        tooltip="Wählen Sie das Geschlecht des Mitglieds"
                                    >
                                        <Select placeholder="Bitte wählen">
                                            {geschlechter.map((g: any) => (
                                                <Select.Option key={g.geschlecht_id} value={g.geschlecht}>
                                                    {g.geschlecht}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>
                            </Card>
                        </div>

                        {/* Schritt 1: Kontaktinformationen */}
                        <div className={currentStep === 1 ? "block" : "hidden"}>
                            <Card title="Kontaktinformationen" className="mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Form.Item
                                        label="E-Mail"
                                        name="email"
                                        rules={[{ type: "email", message: "Bitte geben Sie eine gültige E-Mail-Adresse ein" }]}
                                        tooltip="Die primäre E-Mail-Adresse für Kontakt"
                                    >
                                        <Input placeholder="z.B. max.mustermann@example.com" />
                                    </Form.Item>
                                    <Form.Item label="Telefon" name="telefon" tooltip="Die primäre Telefonnummer für Kontakt">
                                        <Input placeholder="z.B. +43 123 456789" />
                                    </Form.Item>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Form.Item
                                        label="Telefontyp"
                                        name="telefon_typ"
                                        dependencies={["telefon"]}
                                        rules={[
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (getFieldValue("telefon") && !value) {
                                                        return Promise.reject(
                                                            new Error("Bitte wählen Sie einen Telefontyp aus, wenn Sie eine Telefonnummer eingeben")
                                                        );
                                                    }
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                        tooltip="Wählen Sie den Typ der Telefonnummer"
                                    >
                                        <Select placeholder="Bitte wählen">
                                            {telefontypen.map((t: any) => (
                                                <Select.Option key={t.telefonnummer_typ_id} value={t.telefonnummer_typ}>
                                                    {t.telefonnummer_typ}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>
                                <Form.Item label="Straße" name="strasse" tooltip="Die Straße und Hausnummer">
                                    <Input placeholder="z.B. Musterstraße 1" />
                                </Form.Item>
                                <div className="grid grid-cols-3 gap-4">
                                    <Form.Item label="PLZ" name="plz" className="col-span-1" tooltip="Die Postleitzahl">
                                        <Input placeholder="z.B. 1234" />
                                    </Form.Item>
                                    <Form.Item label="Ort" name="ort" className="col-span-2" tooltip="Der Wohnort">
                                        <Input placeholder="z.B. Musterstadt" />
                                    </Form.Item>
                                </div>
                            </Card>
                        </div>

                        {/* Schritt 2: Mitgliedschaftsinformationen */}
                        <div className={currentStep === 2 ? "block" : "hidden"}>
                            <Card title="Mitgliedschaftsinformationen" className="mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Form.Item label="Mitgliedsnummer" name="mitgliedsnummer" tooltip="Eindeutige Identifikation">
                                        <Input placeholder="z.B. 12345" />
                                    </Form.Item>
                                    <Form.Item label="Schützenpassnummer" name="schuetzenpassnummer" tooltip="Offizielle Nummer">
                                        <Input placeholder="z.B. 67890" />
                                    </Form.Item>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Form.Item label="Status" name="status" tooltip="Wählen Sie einen oder mehrere Status">
                                        <Select mode="multiple" placeholder="Status auswählen" className="w-full">
                                            {statusOptions.map((s: any) => (
                                                <Select.Option key={s.status_id} value={s.status_bezeichnung}>
                                                    {s.status_bezeichnung}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Rollen" name="rolle" tooltip="Wählen Sie eine oder mehrere Rollen">
                                        <Select mode="multiple" placeholder="Rollen auswählen" className="w-full">
                                            {roleOptions.map((r: any) => (
                                                <Select.Option key={r.rolle_id} value={r.rolle_bezeichnung}>
                                                    {r.rolle_bezeichnung}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Form.Item label="Titel" name="titel" tooltip="Wählen Sie Titel (optional)">
                                        <Select mode="multiple" placeholder="Titel auswählen" className="w-full">
                                            {titels.map((t: any) => (
                                                <Select.Option key={t.titel_id} value={t.titel}>
                                                    {t.titel}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item label="Ist Landesverband gemeldet?" name="ist_landesverband_gemeldet" valuePropName="checked">
                                        <Checkbox />
                                    </Form.Item>
                                    <Form.Item label="Hat Schlüssel Süßenbrunn?" name="hat_schluessel_suessenbrunn" valuePropName="checked">
                                        <Checkbox />
                                    </Form.Item>
                                </div>
                                <Form.Item label="Notiz" name="notiz">
                                    <Input.TextArea rows={3} placeholder="Zusätzliche Hinweise..." />
                                </Form.Item>
                            </Card>
                        </div>
                    </Form>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                        <div className="flex justify-between items-center">
                            <Button onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
                                Zurück
                            </Button>
                            <Space>
                                <Button
                                    onClick={() => {
                                        setPersonDrawerVisible(false);
                                        form.resetFields();
                                        setFormProgress(0);
                                    }}
                                >
                                    Abbrechen
                                </Button>
                                {currentStep < 2 ? (
                                    <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)} className="bg-blue-500 hover:bg-blue-600">
                                        Weiter
                                    </Button>
                                ) : (
                                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => form.submit()} className="bg-green-500 hover:bg-green-600">
                                        {selectedPerson ? "Speichern" : "Erstellen"}
                                    </Button>
                                )}
                            </Space>
                        </div>
                    </div>
                </Drawer>

                {/* Delete Modal */}
                <Modal
                    title="Mitglied löschen"
                    open={deleteModalVisible}
                    onCancel={() => {
                        setDeleteModalVisible(false);
                        setPersonToDelete(null);
                    }}
                    footer={[
                        <Button
                            key="cancel"
                            onClick={() => {
                                setDeleteModalVisible(false);
                                setPersonToDelete(null);
                            }}
                        >
                            Abbrechen
                        </Button>,
                        <Button
                            key="delete"
                            danger
                            type="primary"
                            onClick={() => {
                                if (personToDelete) {
                                    const formData = new FormData();
                                    formData.append("_action", "delete");
                                    formData.append("person_id", personToDelete.person_id.toString());
                                    fetcher.submit(formData, { method: "post" });
                                    setDeleteModalVisible(false);
                                    setPersonToDelete(null);
                                }
                            }}
                        >
                            Ja, löschen
                        </Button>,
                    ]}
                >
                    <p>
                        Möchten Sie das Mitglied <strong>{personToDelete?.vorname} {personToDelete?.nachname}</strong> wirklich löschen?
                    </p>
                </Modal>
            </Content>
        </Layout>
    );
}

export default App;
