import {useState, useMemo} from "react";
import {
    Layout,
    Card,
    Typography,
    Space,
    Button,
    Input,
    Table,
    Modal,
    Form,
    DatePicker,
    Select,
    Tag,
    Avatar,
    Tooltip,
    message,
    Checkbox,
    Steps,
    Row,
    Col, InputNumber
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    IdcardOutlined, LeftOutlined, RightOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const {Content} = Layout;
const {Title, Text} = Typography;
const {Option} = Select;
const {Step} = Steps;

// MOCK: später durch echten DB‑Call ersetzen
const allStatuses = [
    {status_id: 1, status_bezeichnung: "Aktiv"},
    {status_id: 3, status_bezeichnung: "Ruhend"}
];
const allRollen = [
    {rolle_id: 2, rolle_bezeichnung: "Mitglied"},
    {rolle_id: 3, rolle_bezeichnung: "Trainerin"}
];

export default function PersonPage() {
    // Filter‑State
    const [searchName, setSearchName] = useState("");
    const [searchMitgliedsnummer, setSearchMitgliedsnummer] = useState("");
    const [searchSchuetzenpassnummer, setSearchSchuetzenpassnummer] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<number[]>([]);
    const [selectedRolle, setSelectedRolle] = useState<number[]>([]);
    const [landesverbandChecked, setLandesverbandChecked] = useState(false);
    const [schluesselChecked, setSchluesselChecked] = useState(false);

    // Tabellen‑Auswahl
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
    const [multiDeleteMode, setMultiDeleteMode] = useState(false);

    // Modal & Form‑State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [nameOrderList, setNameOrderList] = useState<string[]>(["NAME"]);
    const [vornameInput, setVornameInput] = useState("");
    const [nachnameInput, setNachnameInput] = useState("");
    const [titelInput, setTitelInput] = useState("");
    const [form] = Form.useForm();

    // mock persons
    const persons = [
        {
            person_id: 1,
            vorname: "Max",
            nachname: "Mustermann",
            voller_name: "Dr. Max Mustermann",
            geburtsdatum: "1990-05-15",
            mitgliedsnummer: 1001,
            schuetzenpassnummer: 5001,
            strasse: "Hauptstraße 1",
            ort: "Wien",
            plz: "1010",
            geschlecht_id: 1,
            ist_landesverband_gemeldet: 1,
            hat_schluessel_suessenbrunn: 1,
            username: "max.mustermann",
            notiz: "Langjähriges Mitglied",
            person_hat_status: [
                {status: {status_id: 1, status_bezeichnung: "Aktiv"}},
                {status: {status_id: 3, status_bezeichnung: "Ruhend"}}
            ],
            person_hat_rolle: [
                {rolle: {rolle_id: 2, rolle_bezeichnung: "Mitglied"}}
            ],
            person_hat_email: [
                {email: {email_id: 1, email_adresse: "max@example.com"}},
                {email: {email_id: 2, email_adresse: "mustermann@example.com"}}
            ],
            person_hat_telefonnummer: [
                {telefonnummer: {telefonnummer_id: 1, telefonnummer: "+43 1234567"}},
                {telefonnummer: {telefonnummer_id: 2, telefonnummer: "+43 7654321"}}
            ],
            geschlecht: {geschlecht: "M"}
        },
        {
            person_id: 2,
            vorname: "Anna",
            nachname: "Schmidt",
            voller_name: "Dr. Mag. Anna Schmidt Ing.",
            geburtsdatum: "1992-08-10",
            mitgliedsnummer: 1002,
            schuetzenpassnummer: 5002,
            strasse: "Lindenweg 5",
            ort: "Graz",
            plz: "8010",
            geschlecht_id: 2,
            ist_landesverband_gemeldet: 0,
            hat_schluessel_suessenbrunn: 0,
            username: "anna.schmidt",
            notiz: "Neue Schützin",
            person_hat_status: [
                {status: {status_id: 1, status_bezeichnung: "Aktiv"}}
            ],
            person_hat_rolle: [
                {rolle: {rolle_id: 3, rolle_bezeichnung: "Trainerin"}}
            ],
            person_hat_email: [
                {email: {email_id: 3, email_adresse: "anna.schmidt@example.com"}}
            ],
            person_hat_telefonnummer: [
                {telefonnummer: {telefonnummer_id: 3, telefonnummer: "+43 9876543"}}
            ],
            geschlecht: {geschlecht: "W"}
        }
    ];

    // Filter‑Logik
    const filteredPersons = useMemo(() => {
        return persons.filter(p => {
            const name = `${p.vorname} ${p.nachname}`.toLowerCase();
            const nameMatch = name.includes(searchName.toLowerCase());
            const mitgliedsnummerMatch = searchMitgliedsnummer
                ? p.mitgliedsnummer?.toString().includes(searchMitgliedsnummer)
                : true;
            const schuetzenpassnummerMatch = searchSchuetzenpassnummer
                ? p.schuetzenpassnummer?.toString().includes(searchSchuetzenpassnummer)
                : true;
            const statusMatch = selectedStatus.length > 0
                ? p.person_hat_status.some(s => selectedStatus.includes(s.status.status_id))
                : true;
            const rolleMatch = selectedRolle.length > 0
                ? p.person_hat_rolle.some(r => selectedRolle.includes(r.rolle.rolle_id))
                : true;
            const landesverbandMatch = landesverbandChecked
                ? p.ist_landesverband_gemeldet === 1
                : true;
            const schluesselMatch = schluesselChecked
                ? p.hat_schluessel_suessenbrunn === 1
                : true;
            return nameMatch && mitgliedsnummerMatch && schuetzenpassnummerMatch
                && statusMatch && rolleMatch && landesverbandMatch && schluesselMatch;
        });
    }, [
        persons,
        searchName,
        searchMitgliedsnummer,
        searchSchuetzenpassnummer,
        selectedStatus,
        selectedRolle,
        landesverbandChecked,
        schluesselChecked
    ]);

    // table columns
    const columns = [
        {
            title: "Person",
            key: "person",
            fixed: "left",
            width: 350,
            render: (record) => (
                <Space>
                    <Avatar
                        size="large"
                        style={{
                            backgroundColor:
                                record.geschlecht?.geschlecht === "W"
                                    ? "#eb2f96"
                                    : record.geschlecht?.geschlecht === "M"
                                        ? "#1890ff"
                                        : "#d9d9d9"
                        }}
                    >
                        {record.vorname[0]}
                        {record.nachname[0]}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <Tooltip title={record.voller_name}>
                            <Text strong>{`${record.vorname} ${record.nachname}`}</Text>
                        </Tooltip>
                        <Text type="secondary">
                            {dayjs(record.geburtsdatum).format("DD.MM.YYYY")}
                        </Text>
                        <Text type="secondary">
                            <Tooltip title="Mitgliedsnummer">
                <span style={{marginRight: 12}}>
                  <IdcardOutlined style={{marginRight: 4}}/>
                    {record.mitgliedsnummer}
                </span>
                            </Tooltip>
                            <Tooltip title="Schützenpassnummer">
                <span>
                  <IdcardOutlined style={{marginRight: 4}}/>
                    {record.schuetzenpassnummer}
                </span>
                            </Tooltip>
                        </Text>
                        {(record.ist_landesverband_gemeldet === 1 ||
                            record.hat_schluessel_suessenbrunn === 1) && (
                            <Text type="secondary">
                                {record.ist_landesverband_gemeldet === 1 && (
                                    <Tooltip title="Ist beim Landesverband gemeldet">
                                        <Tag color="green">Landesverband</Tag>
                                    </Tooltip>
                                )}
                                {record.hat_schluessel_suessenbrunn === 1 && (
                                    <Tooltip title="Hat einen Schlüssel für Süßenbrunn">
                                        <Tag color="blue">Schlüssel</Tag>
                                    </Tooltip>
                                )}
                            </Text>
                        )}
                    </Space>
                </Space>
            )
        },
        {
            title: "Status",
            key: "status",
            render: (record) => (
                <Space wrap>
                    {record.person_hat_status?.map((s) => (
                        <Tag
                            key={s.status.status_id}
                            color={s.status.status_bezeichnung === "Aktiv" ? "green" : "orange"}
                        >
                            {s.status.status_bezeichnung}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "Rollen",
            key: "rollen",
            render: (record) => (
                <Space wrap>
                    {record.person_hat_rolle?.map((r) => (
                        <Tag key={r.rolle.rolle_id} color="geekblue">
                            {r.rolle.rolle_bezeichnung}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "Aktionen",
            key: "actions",
            fixed: "right",
            render: () => (
                <Space>
                    <Button type="text" icon={<EditOutlined/>}>
                        Bearbeiten
                    </Button>
                    <Button type="text" danger icon={<DeleteOutlined/>}>
                        Löschen
                    </Button>
                </Space>
            )
        }
    ];

    // Submit‑Handler
    const handleFormSubmit = async (values: any) => {
        try {
            const voller_name = nameOrderList
                .map(part => {
                    if (part === "VORNAME") return values.vorname;
                    if (part === "NACHNAME") return values.nachname;
                    return part;
                })
                .join(" ");
            values.voller_name = voller_name;

            console.log("Neue Person:", values);
            message.success("Person erfolgreich hinzugefügt");
            setIsModalVisible(false);
            setCurrentStep(0);
            form.resetFields();
            setVornameInput("");
            setNachnameInput("");
            setTitelInput("");
            setNameOrderList(["NAME"]);

        } catch {
            message.error("Fehler beim Hinzufügen");
        }
    };


    // Schritt‑vorwärts nur wenn die nötigen Felder erfüllt sind
    const next = () => {
        if (currentStep === 0) {
            // Basisdaten validieren
            form.validateFields(["vorname", "nachname", "geschlecht_id"])
                .then(() => setCurrentStep(1))
                .catch(() => {
                });
        } else if (currentStep === 1) {
            form.validateFields().then(() => setCurrentStep(s => s + 1)).catch(() => {
            });
        } else {
            setCurrentStep(s => s + 1);
        }

    };

    return (
        <Content className="p-6">
            <Card className="mb-6">
                <Space align="center">
                    <Title level={3}>Personenverwaltung</Title>
                    <Tooltip title="Hier können Sie Mitglieder verwalten.">
                        <InfoCircleOutlined style={{fontSize: 16, color: "#1890ff"}}/>
                    </Tooltip>
                </Space>
            </Card>

            <Card
                title={<Title level={4} style={{margin: 0}}>Personen Liste</Title>}
                extra={
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={() => setIsModalVisible(true)}
                            disabled={multiDeleteMode}
                        >
                            Neue Person
                        </Button>
                        <Button
                            type={multiDeleteMode ? "default" : "dashed"}
                            danger={multiDeleteMode}
                            onClick={() => {
                                setMultiDeleteMode(!multiDeleteMode);
                                setSelectedRowKeys([]);
                            }}
                        >
                            {multiDeleteMode ? "Mehrfachauswahl beenden" : "Mehrere löschen"}
                        </Button>
                        {multiDeleteMode && selectedRowKeys.length > 0 && (
                            <Button
                                danger
                                type="primary"
                                onClick={() => {
                                    message.success(`${selectedRowKeys.length} gelöscht`);
                                    setSelectedRowKeys([]);
                                    setMultiDeleteMode(false);
                                }}
                            >
                                Auswahl löschen ({selectedRowKeys.length})
                            </Button>
                        )}
                    </Space>
                }
            >
                {/* Filterleiste */}
                <div style={{marginBottom: 16}}>
                    <Space wrap>
                        <Input
                            placeholder="Name"
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            allowClear
                        />
                        <Input
                            placeholder="Mitgliedsnummer"
                            value={searchMitgliedsnummer}
                            onChange={e => setSearchMitgliedsnummer(e.target.value)}
                            allowClear
                        />
                        <Input
                            placeholder="Schützenpassnummer"
                            value={searchSchuetzenpassnummer}
                            onChange={e => setSearchSchuetzenpassnummer(e.target.value)}
                            allowClear
                        />
                        <Select
                            mode="multiple"
                            placeholder="Status"
                            allowClear
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                            style={{width: 200}}
                        >
                            {allStatuses.map(s => (
                                <Option key={s.status_id} value={s.status_id}>
                                    {s.status_bezeichnung}
                                </Option>
                            ))}
                        </Select>
                        <Select
                            mode="multiple"
                            placeholder="Rollen"
                            allowClear
                            value={selectedRolle}
                            onChange={setSelectedRolle}
                            style={{width: 200}}
                        >
                            {allRollen.map(r => (
                                <Option key={r.rolle_id} value={r.rolle_id}>
                                    {r.rolle_bezeichnung}
                                </Option>
                            ))}
                        </Select>
                        <Checkbox
                            checked={landesverbandChecked}
                            onChange={e => setLandesverbandChecked(e.target.checked)}
                        >
                            Landesverband
                        </Checkbox>
                        <Checkbox
                            checked={schluesselChecked}
                            onChange={e => setSchluesselChecked(e.target.checked)}
                        >
                            Schlüssel
                        </Checkbox>
                    </Space>
                </div>

                <Table
                    dataSource={filteredPersons}
                    columns={columns}
                    rowKey="person_id"
                    pagination={{pageSize: 5}}
                    rowSelection={
                        multiDeleteMode
                            ? {
                                selectedRowKeys,
                                onChange: setSelectedRowKeys
                            }
                            : undefined
                    }
                />
            </Card>

            <Modal
                title="Neue Person anlegen"
                visible={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setCurrentStep(0);
                    form.resetFields();
                    setVornameInput("");
                    setNachnameInput("");
                    setTitelInput("");
                    setNameOrderList(["NAME"]);
                }}

                footer={null}
                width={800}
            >
                <Steps current={currentStep} style={{marginBottom: 24}}>
                    <Step title="Basisdaten"/>
                    <Step title="Kontakt"/>
                    <Step title="Mitgliedschaft"/>
                    <Step title="Zusatz"/>
                </Steps>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    initialValues={{
                        ist_landesverband_gemeldet: false,
                        hat_schluessel_suessenbrunn: false,
                        telefonnummer_typ: undefined
                    }}
                >
                    {currentStep === 0 && (
                        <>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="vorname"
                                        label="Vorname"
                                        rules={[{required: true, message: "Bitte Vorname eingeben"}]}
                                    >
                                        <Input
                                            value={vornameInput}
                                            onChange={(e) => {
                                                setVornameInput(e.target.value);
                                                form.setFieldValue("vorname", e.target.value); // Sync mit Form
                                            }}
                                        />
                                    </Form.Item>

                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="nachname"
                                        label="Nachname"
                                        rules={[{required: true, message: "Bitte Nachname eingeben"}]}
                                    >
                                        <Input
                                            value={nachnameInput}
                                            onChange={(e) => {
                                                setNachnameInput(e.target.value);
                                                form.setFieldValue("nachname", e.target.value);
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* Titel Builder */}
                            <Form.Item label="Namensbestandteile (in gewünschter Reihenfolge)">
                                <Input.Group compact style={{marginBottom: 12}}>
                                    <Input
                                        style={{width: "calc(100% - 90px)", marginBottom: 4}}
                                        placeholder='z. B. "Dr.", etc.'
                                        value={titelInput}
                                        onChange={(e) => setTitelInput(e.target.value)}
                                        onPressEnter={() => {
                                            if (titelInput.trim()) {
                                                setNameOrderList([...nameOrderList, titelInput.trim()]);
                                                setTitelInput("");
                                            }
                                        }}
                                    />
                                    <Button
                                        type="primary"
                                        size="small"
                                        style={{height: "32px"}}
                                        onClick={() => {
                                            if (titelInput.trim()) {
                                                setNameOrderList([...nameOrderList, titelInput.trim()]);
                                                setTitelInput("");
                                            }
                                        }}
                                    >
                                        Hinzufügen
                                    </Button>
                                </Input.Group>


                                <div style={{marginTop: 8}}>
                                    {nameOrderList.map((item, index) => {
                                        const isNamePlaceholder = item === "NAME";
                                        const label = isNamePlaceholder
                                            ? `${vornameInput || "Vorname"} ${nachnameInput || "Nachname"}`
                                            : item;

                                        return (
                                            <Tag
                                                key={`${item}-${index}`}
                                                closable={!isNamePlaceholder}
                                                onClose={() => {
                                                    if (!isNamePlaceholder) {
                                                        setNameOrderList(nameOrderList.filter((_, i) => i !== index));
                                                    }
                                                }}
                                                style={{
                                                    fontSize: "14px",
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <span style={{fontWeight: 500}}>{label}</span>
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    icon={<LeftOutlined/>}
                                                    onClick={() => {
                                                        if (index > 0) {
                                                            const newList = [...nameOrderList];
                                                            [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
                                                            setNameOrderList(newList);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    icon={<RightOutlined/>}
                                                    onClick={() => {
                                                        if (index < nameOrderList.length - 1) {
                                                            const newList = [...nameOrderList];
                                                            [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
                                                            setNameOrderList(newList);
                                                        }
                                                    }}
                                                />
                                            </Tag>

                                        );
                                    })}
                                </div>

                            </Form.Item>

                            <div style={{marginTop: 16, marginBottom: 40}}>
                                <Text type="secondary">Vorschau vollständiger Name:</Text><br/>
                                <Text strong>
                                    {nameOrderList.map(part => {
                                        if (part === "NAME") {
                                            const vorname = vornameInput || "Vorname";
                                            const nachname = nachnameInput || "Nachname";
                                            return `${vorname} ${nachname}`;
                                        }
                                        return part;
                                    }).join(" ")}
                                </Text>
                            </div>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="geburtsdatum" label="Geburtsdatum">
                                        <DatePicker format="DD.MM.YYYY" style={{width: "100%"}}/>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="geschlecht_id"
                                        label="Geschlecht"
                                        rules={[{required: true, message: "Bitte Geschlecht wählen"}]}
                                    >
                                        <Select placeholder="Geschlecht wählen">
                                            <Option value={1}>M</Option>
                                            <Option value={2}>W</Option>
                                            <Option value={3}>D</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                        </>
                    )}

                    {currentStep === 1 && (
                        <>
                            <Form.Item name="strasse" label="Straße">
                                <Input/>
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item name="plz" label="PLZ">
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={16}>
                                    <Form.Item name="ort" label="Ort">
                                        <Input/>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="E‑Mail‑Adressen">
                                <Form.List name="emails" initialValue={[{}]}>
                                    {(fields, {add, remove}) => (
                                        <>
                                            {fields.map(({key, name, ...restField}, index) => (
                                                <Row key={key} gutter={8} align="middle" style={{marginBottom: 8}}>
                                                    <Col flex="auto">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "adresse"]}
                                                            rules={[{type: "email", message: "Ungültige E‑Mail"}]}
                                                            style={{marginBottom: 0}}
                                                        >
                                                            <Input placeholder="z. B. max@example.com"/>
                                                        </Form.Item>
                                                    </Col>
                                                    <Col>
                                                        {index > 0 && (
                                                            <Button
                                                                danger
                                                                icon={<DeleteOutlined/>}
                                                                onClick={() => remove(name)}
                                                                type="text"
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            ))}
                                            <Button
                                                type="dashed"
                                                onClick={() => add()}
                                                block
                                                icon={<PlusOutlined/>}
                                            >
                                                Neue E‑Mail‑Adresse
                                            </Button>
                                        </>
                                    )}
                                </Form.List>
                            </Form.Item>


                            <Form.Item label="Telefonnummern">
                                <Form.List name="telefonnummern" initialValue={[{}]}>
                                    {(fields, {add, remove}) => (
                                        <>
                                            {fields.map(({key, name, ...restField}, index) => (
                                                <Row key={key} gutter={8} align="middle" style={{marginBottom: 8}}>
                                                    <Col flex="auto">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "nummer"]}
                                                            // Nummer ist jetzt grundsätzlich optional.
                                                            style={{marginBottom: 0}}
                                                        >
                                                            <Input placeholder="z. B. +43 123456789"/>
                                                        </Form.Item>
                                                    </Col>
                                                    <Col style={{width: 130}}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "typ"]}
                                                            // Typ nur dann Pflicht, wenn eine Nummer eingegeben wurde
                                                            rules={[
                                                                ({getFieldValue}) => ({
                                                                    validator(_, value) {
                                                                        const all = getFieldValue("telefonnummern") || [];
                                                                        const entry = all[name] || {};
                                                                        if (entry.nummer && !value) {
                                                                            return Promise.reject(new Error("Typ wählen"));
                                                                        }
                                                                        return Promise.resolve();
                                                                    }
                                                                })
                                                            ]}
                                                            style={{marginBottom: 0}}
                                                        >
                                                            <Select placeholder="Typ">
                                                                <Option value="mobil">Mobil</Option>
                                                                <Option value="festnetz">Festnetz</Option>
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>
                                                    <Col>
                                                        {index > 0 && (
                                                            <Button
                                                                danger
                                                                icon={<DeleteOutlined/>}
                                                                onClick={() => remove(name)}
                                                                type="text"
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            ))}
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined/>}>
                                                Neue Telefonnummer
                                            </Button>
                                        </>
                                    )}
                                </Form.List>
                            </Form.Item>


                        </>
                    )}

                    {currentStep === 2 && (
                        <Row gutter={16}>
                            {/* Mitglnr */}
                            <Col span={12}>
                                <Form.Item
                                    name="mitgliedsnummer"
                                    label="Mitgliedsnummer"
                                    rules={[{type: "number", min: 1, message: "Muss größer 0 sein"}]}
                                >
                                    <InputNumber min={1} style={{width: "100%"}}/>
                                </Form.Item>
                            </Col>

                            {/* Schützenpassnr */}
                            <Col span={12}>
                                <Form.Item
                                    name="schuetzenpassnummer"
                                    label="Schützenpassnummer"
                                    rules={[{type: "number", min: 1, message: "Muss größer 0 sein"}]}
                                >
                                    <InputNumber min={1} style={{width: "100%"}}/>
                                </Form.Item>
                            </Col>

                            {/* Landesverband gemeldet */}
                            <Col span={12}>
                                <Form.Item
                                    name="ist_landesverband_gemeldet"
                                    valuePropName="checked"
                                    // kein label hier, wir nutzen das im Checkbox‑Text
                                >
                                    <Checkbox>Landesverband gemeldet</Checkbox>
                                </Form.Item>
                            </Col>

                            {/* Schlüssel für Süßenbrunn */}
                            <Col span={12}>
                                <Form.Item
                                    name="hat_schluessel_suessenbrunn"
                                    valuePropName="checked"
                                >
                                    <Checkbox>Schlüssel für Süßenbrunn</Checkbox>
                                </Form.Item>
                            </Col>

                            {/* Beitrittsdatum über volle Breite */}
                            <Col span={24}>
                                <Form.Item name="beitrittsdatum" label="Beitrittsdatum">
                                    <DatePicker format="DD.MM.YYYY" style={{width: "100%"}}/>
                                </Form.Item>
                            </Col>
                        </Row>
                    )}


                    {currentStep === 3 && (
                        <>
                            <Form.Item name="username" label="Benutzername">
                                <Input/>
                            </Form.Item>
                            <Form.Item name="notiz" label="Notiz">
                                <Input.TextArea rows={4}/>
                            </Form.Item>
                        </>
                    )}

                    <Form.Item>
                        <Space>
                            {currentStep === 0 && (
                                <Button
                                    onClick={() => {
                                        setIsModalVisible(false);
                                        setCurrentStep(0);
                                        form.resetFields();
                                        setVornameInput("");
                                        setNachnameInput("");
                                        setTitelInput("");
                                        setNameOrderList(["NAME"]);
                                    }}
                                >
                                    Abbrechen
                                </Button>
                            )}
                            {currentStep > 0 && (
                                <Button onClick={() => setCurrentStep(s => s - 1)}>
                                    Zurück
                                </Button>
                            )}
                            {currentStep < 3 && (
                                <Button type="primary" onClick={next}>
                                    Weiter
                                </Button>
                            )}
                            {currentStep === 3 && (
                                <Button type="primary" htmlType="submit">
                                    Speichern
                                </Button>
                            )}
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Content>
    );
}
