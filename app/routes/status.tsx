import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState, useEffect } from "react";
import {
    Layout, Table, Button, Modal, Form as AntForm, Input, Card, Typography, Space, Tooltip
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title } = Typography;

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const statuses = await prisma.status.findMany({
        orderBy: { status_id: 'asc' }
    });
    return json({ statuses });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");

    switch (action) {
        case "create":
        case "update":
            const statusId = formData.get("status_id");
            const statusData = {
                status_bezeichnung: formData.get("status_bezeichnung") as string,
            };

            if (action === "create") {
                await prisma.status.create({ data: statusData });
            } else {
                await prisma.status.update({
                    where: { status_id: Number.parseInt(statusId as string) },
                    data: statusData,
                });
            }
            break;

        case "delete":
            const deleteId = formData.get("status_id");
            await prisma.status.delete({ where: { status_id: Number.parseInt(deleteId as string) } });
            break;

        case "multiDelete":
            const ids = formData.getAll("status_ids[]").map(id => Number(id));
            await prisma.status.deleteMany({
                where: { status_id: { in: ids } }
            });
            break;
    }

    return null;
};

export default function StatusList() {
    const { statuses } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingStatus, setEditingStatus] = useState<{ status_id: number; status_bezeichnung: string } | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<{ status_id: number; status_bezeichnung: string } | null>(null);
    const [form] = AntForm.useForm();
    const [searchText, setSearchText] = useState('');
    const [multiDeleteMode, setMultiDeleteMode] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

    useEffect(() => {
        if (editingStatus) {
            form.setFieldsValue(editingStatus);
        } else {
            form.resetFields();
        }
    }, [editingStatus, form]);

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingStatus(null);
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
            title: 'Status Bezeichnung',
            dataIndex: 'status_bezeichnung',
            key: 'status_bezeichnung',
            sorter: (a: any, b: any) =>
                a.status_bezeichnung.localeCompare(b.status_bezeichnung, 'de', { sensitivity: 'base' }),
            sortDirections: ['ascend', 'descend'],
        },
        {
            title: '',
            key: 'actions',
            align: 'right',
            render: (_: any, record: any) =>
                !multiDeleteMode && (
                    <div style={{ textAlign: 'right', width: '100%' }}>
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    setEditingStatus(record);
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
                                    setStatusToDelete(record);
                                    setDeleteModalVisible(true);
                                }}
                            >
                                Löschen
                            </Button>
                        </Space>
                    </div>
                ),
        },
    ];

    const filteredStatuses = statuses.filter(status =>
        status.status_bezeichnung.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Content className="p-6">
            <Card className="mb-6">
                <Space align="center">
                    <Title level={3} style={{ margin: 0 }}>Status Verwaltung</Title>
                    <Tooltip title="Hier können Sie die verschiedenen Status für Mitglieder verwalten. Status können beispielsweise 'Aktiv', 'Inaktiv', 'Ruhend' oder andere Zustände sein, die den aktuellen Stand eines Mitglieds beschreiben.">
                        <InfoCircleOutlined style={{ fontSize: '15px', color: '#1890ff' }} />
                    </Tooltip>
                </Space>
            </Card>

            <Card
                title={<Space><Title level={4} style={{ margin: 0 }}>Status Liste</Title></Space>}
                extra={
                    <Space>
                        <Button
                            type={multiDeleteMode ? "default" : "primary"}
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingStatus(null);
                                setIsModalVisible(true);
                            }}
                            disabled={multiDeleteMode}
                        >
                            Neuer Status
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
                                    selectedRowKeys.forEach((id) =>
                                        formData.append("status_ids[]", id.toString())
                                    );
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
                <div style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="Status suchen..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                        style={{ width: 300 }}
                    />
                </div>

                <Table
                    dataSource={filteredStatuses}
                    columns={columns}
                    rowKey="status_id"
                    pagination={{ pageSize: 10 }}
                    rowSelection={rowSelection}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={editingStatus ? "Status bearbeiten" : "Neuer Status"}
                open={isModalVisible}
                onCancel={handleModalCancel}
                footer={[
                    <Button key="cancel" onClick={handleModalCancel}>
                        Abbrechen
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={async () => {
                            try {
                                const values = await form.validateFields();
                                const formData = new FormData();
                                formData.append("_action", editingStatus ? "update" : "create");
                                formData.append("status_bezeichnung", values.status_bezeichnung);
                                if (editingStatus) {
                                    formData.append("status_id", editingStatus.status_id.toString());
                                }
                                fetcher.submit(formData, { method: "post" });

                                setIsModalVisible(false);
                                setEditingStatus(null);
                                form.resetFields();
                            } catch (error) {
                                // validation failed
                            }
                        }}
                    >
                        {editingStatus ? "Aktualisieren" : "Erstellen"}
                    </Button>,
                ]}
            >
                <AntForm form={form} layout="vertical">
                    <AntForm.Item
                        label="Status Bezeichnung"
                        name="status_bezeichnung"
                        rules={[{ required: true, message: "Bitte geben Sie eine Bezeichnung ein" }]}
                    >
                        <Input />
                    </AntForm.Item>
                </AntForm>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Status löschen"
                open={deleteModalVisible}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setStatusToDelete(null);
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
                            if (statusToDelete) {
                                const formData = new FormData();
                                formData.append("_action", "delete");
                                formData.append("status_id", statusToDelete.status_id.toString());
                                fetcher.submit(formData, { method: "post" });

                                setDeleteModalVisible(false);
                                setStatusToDelete(null);
                            }
                        }}
                    >
                        Ja, löschen
                    </Button>,
                ]}
            >
                <p>
                    Möchten Sie den Status <strong>{statusToDelete?.status_bezeichnung}</strong> wirklich löschen?
                </p>
            </Modal>
        </Content>
    );
}
