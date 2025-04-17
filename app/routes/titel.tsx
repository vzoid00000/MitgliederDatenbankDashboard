import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState, useEffect } from "react";
import {
    Layout,
    Table,
    Button,
    Modal,
    Form as AntForm,
    Input,
    Card,
    Typography,
    Space,
    Tooltip,
    Select,
    message
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const titels = await prisma.titel.findMany({
        orderBy: { titel_id: 'asc' }
    });
    return json({ titels });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");

    try {
        switch (action) {
            case "create": {
                const data = {
                    titel: formData.get("titel") as string,
                    position: formData.get("position") as "VOR" | "NACH",
                };
                await prisma.titel.create({ data });
                return json({ result: "created" });
            }

            case "update": {
                const titelId = Number(formData.get("titel_id"));
                const data = {
                    titel: formData.get("titel") as string,
                    position: formData.get("position") as "VOR" | "NACH",
                };
                await prisma.titel.update({
                    where: { titel_id: titelId },
                    data,
                });
                return json({ result: "updated" });
            }

            case "delete": {
                const id = Number(formData.get("titel_id"));
                await prisma.titel.delete({ where: { titel_id: id } });
                return json({ result: "deleted" });
            }

            case "multiDelete": {
                const ids = formData.getAll("titel_ids[]").map(id => Number(id));
                await prisma.titel.deleteMany({
                    where: { titel_id: { in: ids } }
                });
                return json({ result: "multiDeleted", count: ids.length });
            }
        }
    } catch (error: any) {
        console.error("Action Error:", error);
        return json({ result: "error", message: "Fehler bei der Aktion." });
    }

    return json({ result: "unknown" });
};

export default function TitelList() {
    const { titels } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTitel, setEditingTitel] = useState<any>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [titelToDelete, setTitelToDelete] = useState<any>(null);
    const [form] = AntForm.useForm();
    const [searchText, setSearchText] = useState('');
    const [multiDeleteMode, setMultiDeleteMode] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

    useEffect(() => {
        if (editingTitel) {
            form.setFieldsValue(editingTitel);
        } else {
            form.resetFields();
        }
    }, [editingTitel, form]);

    useEffect(() => {
        if (fetcher.data?.result) {
            switch (fetcher.data.result) {
                case "created":
                    message.success("Titel erfolgreich erstellt.");
                    break;
                case "updated":
                    message.success("Titel erfolgreich aktualisiert.");
                    break;
                case "deleted":
                    message.success("Titel erfolgreich gelöscht.");
                    break;
                case "multiDeleted":
                    message.success(`${fetcher.data.count} Titel erfolgreich gelöscht.`);
                    break;
                case "error":
                    message.error(fetcher.data?.message || "Fehler bei der Aktion.");
                    break;
                default:
                    message.info("Aktion abgeschlossen.");
            }
        }
    }, [fetcher.data]);

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingTitel(null);
        form.resetFields();
    };

    const rowSelection = multiDeleteMode
        ? {
            selectedRowKeys,
            onChange: (newSelectedRowKeys: React.Key[]) => {
                setSelectedRowKeys(newSelectedRowKeys as number[]);
            },
        }
        : undefined;

    const columns = [
        {
            title: 'Titel',
            dataIndex: 'titel',
            key: 'titel',
            sorter: (a: any, b: any) => a.titel.localeCompare(b.titel, 'de', { sensitivity: 'base' }),
        },
        {
            title: 'Position',
            dataIndex: 'position',
            key: 'position',
            render: (pos: string) => pos === 'VOR' ? 'Vor dem Namen' : 'Nach dem Namen',
            filters: [
                { text: 'Vor dem Namen', value: 'VOR' },
                { text: 'Nach dem Namen', value: 'NACH' },
            ],
            onFilter: (value: string, record: any) => record.position === value,
        },
        {
            title: '',
            key: 'actions',
            align: 'right',
            render: (_: any, record: any) =>
                !multiDeleteMode && (
                    <Space>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingTitel(record);
                                setIsModalVisible(true);
                            }}
                            type="link"
                        >
                            Bearbeiten
                        </Button>
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                setTitelToDelete(record);
                                setDeleteModalVisible(true);
                            }}
                        >
                            Löschen
                        </Button>
                    </Space>
                ),
        },
    ];

    const filteredTitels = titels.filter(titel =>
        titel.titel.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Content className="p-6">
            <Card className="mb-6">
                <Space align="center">
                    <Title level={3} style={{ margin: 0 }}>Titel Verwaltung</Title>
                    <Tooltip title="Ein Titel kann z.B. 'Dr.' oder 'MBA' sein und wird einer Person vor oder nach dem Namen angezeigt.">
                        <InfoCircleOutlined style={{ fontSize: '15px', color: '#1890ff' }} />
                    </Tooltip>
                </Space>
            </Card>

            <Card
                title={<Title level={4} style={{ margin: 0 }}>Titel Liste</Title>}
                extra={
                    <Space>
                        <Button
                            type={multiDeleteMode ? "default" : "primary"}
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingTitel(null);
                                setIsModalVisible(true);
                            }}
                            disabled={multiDeleteMode}
                        >
                            Neuer Titel
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
                                    const formData = new FormData();
                                    formData.append("_action", "multiDelete");
                                    selectedRowKeys.forEach((id) => formData.append("titel_ids[]", id.toString()));
                                    fetcher.submit(formData, { method: "post" });

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
                <Input.Search
                    placeholder="Titel suchen..."
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    value={searchText}
                    style={{ width: 300, marginBottom: 16 }}
                />

                <Table
                    dataSource={filteredTitels}
                    columns={columns}
                    rowKey="titel_id"
                    pagination={{ pageSize: 10 }}
                    rowSelection={rowSelection}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={editingTitel ? "Titel bearbeiten" : "Neuer Titel"}
                open={isModalVisible}
                onCancel={handleModalCancel}
                footer={[
                    <Button key="cancel" onClick={handleModalCancel}>Abbrechen</Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={async () => {
                            try {
                                const values = await form.validateFields();

                                if (
                                    editingTitel &&
                                    values.titel.trim() === editingTitel.titel.trim() &&
                                    values.position === editingTitel.position
                                ) {
                                    message.info("Keine Änderungen vorgenommen.");
                                    handleModalCancel();
                                    return;
                                }

                                const formData = new FormData();
                                formData.append("_action", editingTitel ? "update" : "create");
                                formData.append("titel", values.titel);
                                formData.append("position", values.position);
                                if (editingTitel) {
                                    formData.append("titel_id", editingTitel.titel_id.toString());
                                }

                                fetcher.submit(formData, { method: "post" });
                                handleModalCancel();
                            } catch (error) {
                                // validation error
                            }
                        }}
                    >
                        {editingTitel ? "Aktualisieren" : "Erstellen"}
                    </Button>,
                ]}
            >
                <AntForm form={form} layout="vertical">
                    <AntForm.Item
                        label="Titel"
                        name="titel"
                        rules={[{ required: true, message: "Bitte Titel eingeben" }]}
                    >
                        <Input />
                    </AntForm.Item>

                    <AntForm.Item
                        label="Position"
                        name="position"
                        rules={[{ required: true, message: "Bitte Position auswählen" }]}
                    >
                        <Select placeholder="Position wählen">
                            <Option value="VOR">Vor dem Namen</Option>
                            <Option value="NACH">Nach dem Namen</Option>
                        </Select>
                    </AntForm.Item>
                </AntForm>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Titel löschen"
                open={deleteModalVisible}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setTitelToDelete(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
                        Abbrechen
                    </Button>,
                    <Button
                        key="delete"
                        danger
                        type="primary"
                        onClick={() => {
                            if (titelToDelete) {
                                const formData = new FormData();
                                formData.append("_action", "delete");
                                formData.append("titel_id", titelToDelete.titel_id.toString());
                                fetcher.submit(formData, { method: "post" });

                                setDeleteModalVisible(false);
                                setTitelToDelete(null);
                            }
                        }}
                    >
                        Ja, löschen
                    </Button>,
                ]}
            >
                <p>
                    Möchten Sie den Titel <strong>{titelToDelete?.titel}</strong> wirklich löschen?
                </p>
            </Modal>
        </Content>
    );
}
