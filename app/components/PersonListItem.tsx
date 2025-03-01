"use client"

import {useState} from "react"
import {Form as RemixForm} from "@remix-run/react"
import {Card, Typography, Button, Descriptions, Tag, Divider, Space, Modal} from "antd"
import {
    DeleteOutlined,
    ExpandAltOutlined,
    CompressOutlined,
    PhoneOutlined,
    MailOutlined,
} from "@ant-design/icons"

export interface PersonListItemProps {
    person: any
}

export default function PersonListItem({person}: PersonListItemProps) {
    const [expanded, setExpanded] = useState(false)
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const {Title, Text} = Typography

    const mitgliedschaft =
        person.mitgliedschaftszeitraum && person.mitgliedschaftszeitraum.length > 0
            ? person.mitgliedschaftszeitraum.find((m: any) => m.bis === null) || person.mitgliedschaftszeitraum[0]
            : null

    const beforeTitles = person.person_hat_titel
        .filter((pt: any) => pt.titel.titel_typ.titel_typ_bezeichnung.toLowerCase().includes("vor"))
        .sort((a: any, b: any) => a.reihenfolge - b.reihenfolge)
        .map((pt: any) => pt.titel.titel)

    const afterTitles = person.person_hat_titel
        .filter((pt: any) => pt.titel.titel_typ.titel_typ_bezeichnung.toLowerCase().includes("nach"))
        .sort((a: any, b: any) => a.reihenfolge - b.reihenfolge)
        .map((pt: any) => pt.titel.titel)

    const fullName = `${beforeTitles.join(" ")} ${person.vorname} ${person.nachname} ${afterTitles.join(" ")}`.trim()

    const showDeleteConfirm = () => {
        setDeleteModalVisible(true)
    }

    const handleDeleteCancel = () => {
        setDeleteModalVisible(false)
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "verstorben":
                return "red"
            case "ruhend":
                return "orange"
            case "student":
                return "blue"
            default:
                return "green"
        }
    }

    return (
        <Card
            className="mb-4"
            title={
                <div className="flex justify-between items-center">
                    <Space>

                        <Title level={4} style={{margin: 0}}>
                            {person.vorname} {person.nachname}
                        </Title>
                    </Space>
                    <Tag color={getStatusColor(person.status?.status_bezeichnung || "")}>
                        {person.status ? person.status.status_bezeichnung : "N/A"}
                    </Tag>
                </div>
            }
            extra={
                <Button
                    type="text"
                    onClick={() => setExpanded(!expanded)}
                    icon={expanded ? <CompressOutlined/> : <ExpandAltOutlined/>}
                >
                    {expanded ? "Details ausblenden" : "Details anzeigen"}
                </Button>
            }
            styles={{
                body: {
                    display: expanded ? "block" : "none",
                },
            }}
        >
            {expanded && (
                <>
                    <Descriptions bordered size="small" column={{xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1}}>
                        <Descriptions.Item label="Geburtsdatum">
                            {person.geburtsdatum ? new Date(person.geburtsdatum).toLocaleDateString() : "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mitgliedsnummer">{person.mitgliedsnummer || "N/A"}</Descriptions.Item>
                        <Descriptions.Item
                            label="Schützenpassnummer">{person.schuetzenpassnummer || "N/A"}</Descriptions.Item>
                        <Descriptions.Item label="Straße">{person.strasse || "N/A"}</Descriptions.Item>
                        <Descriptions.Item label="PLZ">{person.plz || "N/A"}</Descriptions.Item>
                        <Descriptions.Item label="Ort">{person.ort || "N/A"}</Descriptions.Item>
                        <Descriptions.Item label="Beim Landesverband gemeldet?">
                            {person.ist_landesverband_gemeldet ? "Ja" : "Nein"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hat Schlüssel Süßenbrunn?">
                            {person.hat_schluessel_suessenbrunn ? "Ja" : "Nein"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Rolle">{person.rolle.rolle_bezeichnung}</Descriptions.Item>
                    </Descriptions>

                    {person.notiz && (
                        <>
                            <Divider orientation="left">Notiz</Divider>
                            <Text>{person.notiz}</Text>
                        </>
                    )}

                    {mitgliedschaft && (
                        <>
                            <Divider orientation="left">Mitgliedschaft</Divider>
                            <Descriptions bordered size="small" column={{xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}}>
                                <Descriptions.Item label="Beitrittsdatum">
                                    {mitgliedschaft.von ? new Date(mitgliedschaft.von).toLocaleDateString() : "N/A"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Austrittsdatum">
                                    {mitgliedschaft.bis ? new Date(mitgliedschaft.bis).toLocaleDateString() : "N/A"}
                                </Descriptions.Item>
                            </Descriptions>
                        </>
                    )}

                    {person.person_hat_email.length > 0 && (
                        <>
                            <Divider orientation="left">
                                <Space>
                                    <MailOutlined/>
                                    E-Mail Adressen
                                </Space>
                            </Divider>
                            <ul className="list-disc pl-5">
                                {person.person_hat_email.map((phe: any) => (
                                    <li key={phe.email.email_id}>{phe.email.email_adresse}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    {person.person_hat_telefonnummer.length > 0 && (
                        <>
                            <Divider orientation="left">
                                <Space>
                                    <PhoneOutlined/>
                                    Telefonnummern
                                </Space>
                            </Divider>
                            <ul className="list-disc pl-5">
                                {person.person_hat_telefonnummer.map((pht: any) => (
                                    <li key={pht.telefonnummer.telefonnummer_id}>
                                        {pht.telefonnummer.telefonnummer} (
                                        <Text strong>{pht.telefonnummer.telefonnummer_typ.telefonnummer_typ}</Text>)
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <Divider orientation="left">Vollständiger Name</Divider>
                    <Text type="secondary">{fullName}</Text>

                    <Divider/>
                    <div className="flex justify-end">
                        <Button danger type="primary" icon={<DeleteOutlined/>} onClick={showDeleteConfirm}>
                            Löschen
                        </Button>
                    </div>

                    <Modal
                        title="Person löschen"
                        centered
                        open={deleteModalVisible}
                        onOk={() => {
                            setDeleteModalVisible(false)
                            document
                                .getElementById(`delete-form-${person.person_id}`)
                                ?.dispatchEvent(new Event("submit", {cancelable: true, bubbles: true}))
                        }}
                        onCancel={handleDeleteCancel}
                        okText="Ja, löschen"
                        cancelText="Abbrechen"
                        okButtonProps={{danger: true}}
                    >
                        <p>Wollen Sie diese Person wirklich löschen?</p>
                    </Modal>

                    <RemixForm id={`delete-form-${person.person_id}`} method="post" style={{display: "none"}}>
                        <input type="hidden" name="_action" value="delete"/>
                        <input type="hidden" name="person_id" value={person.person_id}/>
                    </RemixForm>
                </>
            )}
        </Card>
    )
}

