import { useState, useMemo } from "react";
import {
    Layout, Card, Typography, Space, Button, Input, Table, Modal, Form,
    DatePicker, Select, Switch, Tabs, Tag, Row, Col, Avatar, Tooltip, message, Checkbox
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined,
    MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, UserOutlined,
    FileTextOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// MOCK: ersetze später durch echten DB-Call
const allStatuses = [
    { status_id: 1, status_bezeichnung: "Aktiv" },
    { status_id: 3, status_bezeichnung: "Ruhend" },
];
const allRollen = [
    { rolle_id: 2, rolle_bezeichnung: "Mitglied" },
    { rolle_id: 3, rolle_bezeichnung: "Trainerin" },
];

export default function PersonPage() {
    const [searchName, setSearchName] = useState("");
    const [searchMitgliedsnummer, setSearchMitgliedsnummer] = useState("");
    const [searchSchuetzenpassnummer, setSearchSchuetzenpassnummer] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<number[]>([]);
    const [selectedRolle, setSelectedRolle] = useState<number[]>([]);
    const [landesverbandChecked, setLandesverbandChecked] = useState(false);
    const [schluesselChecked, setSchluesselChecked] = useState(false);

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [multiDeleteMode, setMultiDeleteMode] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [activeStep, setActiveStep] = useState("1");

    const persons = [
        {
            person_id: 1,
            vorname: "Max",
            nachname: "Mustermann",
            titel: [{ titel: { titel: "Dr." } }],
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
                { status: { status_id: 1, status_bezeichnung: "Aktiv" } },
                { status: { status_id: 3, status_bezeichnung: "Ruhend" } }
            ],
            person_hat_rolle: [
                { rolle: { rolle_id: 2, rolle_bezeichnung: "Mitglied" } }
            ],
            person_hat_email: [
                { email: { email_id: 1, email_adresse: "max@example.com" } },
                { email: { email_id: 2, email_adresse: "mustermann@example.com" } }
            ],
            person_hat_telefonnummer: [
                { telefonnummer: { telefonnummer_id: 1, telefonnummer: "+43 1234567" } },
                { telefonnummer: { telefonnummer_id: 2, telefonnummer: "+43 7654321" } }
            ],
            geschlecht: { geschlecht: "M" }
        },
        {
            person_id: 2,
            vorname: "Anna",
            nachname: "Schmidt",
            titel: [],
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
                { status: { status_id: 1, status_bezeichnung: "Aktiv" } }
            ],
            person_hat_rolle: [
                { rolle: { rolle_id: 3, rolle_bezeichnung: "Trainerin" } }
            ],
            person_hat_email: [
                { email: { email_id: 3, email_adresse: "anna.schmidt@example.com" } }
            ],
            person_hat_telefonnummer: [
                { telefonnummer: { telefonnummer_id: 3, telefonnummer: "+43 9876543" } }
            ],
            geschlecht: { geschlecht: "W" }
        }
    ];

    const filteredPersons = useMemo(() => {
        return persons.filter((p) => {
            const name = `${p.vorname} ${p.nachname}`.toLowerCase();
            const nameMatch = name.includes(searchName.toLowerCase());
            const mitgliedsnummerMatch = searchMitgliedsnummer
                ? p.mitgliedsnummer?.toString().includes(searchMitgliedsnummer)
                : true;
            const schuetzenpassnummerMatch = searchSchuetzenpassnummer
                ? p.schuetzenpassnummer?.toString().includes(searchSchuetzenpassnummer)
                : true;
            const statusMatch =
                selectedStatus.length > 0
                    ? p.person_hat_status?.some((s) =>
                        selectedStatus.includes(s.status.status_id)
                    )
                    : true;
            const rolleMatch =
                selectedRolle.length > 0
                    ? p.person_hat_rolle?.some((r) =>
                        selectedRolle.includes(r.rolle.rolle_id)
                    )
                    : true;
            const landesverbandMatch = landesverbandChecked
                ? p.ist_landesverband_gemeldet === 1
                : true;
            const schluesselMatch = schluesselChecked
                ? p.hat_schluessel_suessenbrunn === 1
                : true;

            return (
                nameMatch &&
                mitgliedsnummerMatch &&
                schuetzenpassnummerMatch &&
                statusMatch &&
                rolleMatch &&
                landesverbandMatch &&
                schluesselMatch
            );
        });
    }, [
        persons,
        searchName,
        searchMitgliedsnummer,
        searchSchuetzenpassnummer,
        selectedStatus,
        selectedRolle,
        landesverbandChecked,
        schluesselChecked,
    ]);

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
                                        : "#d9d9d9",
                        }}
                    >
                        {record.vorname[0]}{record.nachname[0]}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <Text strong>
                            {(record.titel?.map((t) => t.titel.titel).join(" ") || "") + " " + record.vorname + " " + record.nachname}
                        </Text>
                        <Text type="secondary">{dayjs(record.geburtsdatum).format("DD.MM.YYYY")}</Text>
                        <Text type="secondary">
                            <Tooltip title="Mitgliedsnummer">
                                <span style={{ marginRight: 12 }}>
                                    <IdcardOutlined style={{ marginRight: 4 }} />
                                    {record.mitgliedsnummer}
                                </span>
                            </Tooltip>
                            <Tooltip title="Schützenpassnummer">
                                <span>
                                    <IdcardOutlined style={{ marginRight: 4 }} />
                                    {record.schuetzenpassnummer}
                                </span>
                            </Tooltip>
                        </Text>
                        {(record.ist_landesverband_gemeldet === 1 || record.hat_schluessel_suessenbrunn === 1) && (
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
            ),
        },
        {
            title: "Status",
            key: "status",
            render: (record) => (
                <Space wrap>
                    {record.person_hat_status?.map((s) => (
                        <Tag key={s.status.status_id} color={s.status.status_bezeichnung === "Aktiv" ? "green" : "orange"}>
                            {s.status.status_bezeichnung}
                        </Tag>
                    ))}
                </Space>
            ),
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
            ),
        },
        {
            title: "Aktionen",
            key: "actions",
            fixed: "right",
            render: () => (
                <Space>
                    <Button type="text" icon={<EditOutlined />}>Bearbeiten</Button>
                    <Button type="text" danger icon={<DeleteOutlined />}>Löschen</Button>
                </Space>
            ),
        },
    ];

    return (
        <Content className="p-6">
            <Card className="mb-6">
                <Space align="center">
                    <Title level={3}>Personenverwaltung</Title>
                    <Tooltip title="Hier können Sie Mitglieder verwalten.">
                        <InfoCircleOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
                    </Tooltip>
                </Space>
            </Card>

            <Card
                title={<Title level={4} style={{ margin: 0 }}>Personen Liste</Title>}
                extra={
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setIsModalVisible(true);
                                form.resetFields();
                                setActiveStep("1");
                            }}
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
                                    message.success(`${selectedRowKeys.length} Personen gelöscht (Demo).`);
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
                <div style={{ marginBottom: 16 }}>
                    <Space wrap>
                        <Input placeholder="Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} allowClear />
                        <Input placeholder="Mitgliedsnummer" value={searchMitgliedsnummer} onChange={(e) => setSearchMitgliedsnummer(e.target.value)} allowClear />
                        <Input placeholder="Schützenpassnummer" value={searchSchuetzenpassnummer} onChange={(e) => setSearchSchuetzenpassnummer(e.target.value)} allowClear />
                        <Select
                            mode="multiple"
                            placeholder="Status"
                            allowClear
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                            style={{ width: 200 }}
                        >
                            {allStatuses.map((s) => (
                                <Option key={s.status_id} value={s.status_id}>{s.status_bezeichnung}</Option>
                            ))}
                        </Select>
                        <Select
                            mode="multiple"
                            placeholder="Rollen"
                            allowClear
                            value={selectedRolle}
                            onChange={setSelectedRolle}
                            style={{ width: 200 }}
                        >
                            {allRollen.map((r) => (
                                <Option key={r.rolle_id} value={r.rolle_id}>{r.rolle_bezeichnung}</Option>
                            ))}
                        </Select>
                        <Checkbox checked={landesverbandChecked} onChange={(e) => setLandesverbandChecked(e.target.checked)}>
                            Landesverband
                        </Checkbox>
                        <Checkbox checked={schluesselChecked} onChange={(e) => setSchluesselChecked(e.target.checked)}>
                            Schlüssel
                        </Checkbox>
                    </Space>
                </div>

                <Table
                    dataSource={filteredPersons}
                    columns={columns}
                    rowKey="person_id"
                    pagination={{ pageSize: 5 }}
                    rowSelection={multiDeleteMode ? {
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    } : undefined}
                />
            </Card>
        </Content>
    );
}
