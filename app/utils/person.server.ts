import {prisma} from "~/db.server";
import {Prisma} from "@prisma/client";

export async function loadPersonData() {
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
    return Response.json({persons, geschlechter, telefonnummerTypen, roles, statuses, titles});
}

export async function actionPersonData(request: Request) {
    try {
        const formData = await request.formData();
        const action = formData.get("_action");

        const mitgliedsnummerStr = formData.get("mitgliedsnummer");
        let mitgliedsnummer: number | null = null;
        if (mitgliedsnummerStr) {
            const parsed = parseInt(mitgliedsnummerStr as string, 10);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return Response.json(
                    {error: "Mitgliedsnummer muss eine positive Ganzzahl größer als 0 sein."},
                    {status: 400}
                );
            }
            mitgliedsnummer = parsed;
        }

        const schuetzenpassnummerStr = formData.get("schuetzenpassnummer");
        let schuetzenpassnummer: number | null = null;
        if (schuetzenpassnummerStr) {
            const parsed = parseInt(schuetzenpassnummerStr as string, 10);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return Response.json(
                    {error: "Schützenpassnummer muss eine positive Ganzzahl größer als 0 sein."},
                    {status: 400}
                );
            }
            schuetzenpassnummer = parsed;
        }

        const personData = {
            vorname: formData.get("vorname") as string,
            nachname: formData.get("nachname") as string,
            geburtsdatum: formData.get("geburtsdatum") ? new Date(formData.get("geburtsdatum") as string) : null,
            geschlecht_id: parseInt(formData.get("geschlecht_id") as string),
            rolle_id: parseInt(formData.get("rolle_id") as string),
            status_id: parseInt(formData.get("status_id") as string),
            notiz: formData.get("notiz") as string,
            ist_landesverband_gemeldet: parseInt(formData.get("ist_landesverband_gemeldet") as string),
            hat_schluessel_suessenbrunn: parseInt(formData.get("hat_schluessel_suessenbrunn") as string),
            mitgliedsnummer: mitgliedsnummer,
            schuetzenpassnummer: schuetzenpassnummer,
            strasse: formData.get("strasse") as string,
            ort: formData.get("ort") as string,
            plz: formData.get("plz") as string,
        };

        const emails = formData.getAll("emails[]").filter(Boolean) as string[];
        const telefonnummern = formData.getAll("telefonnummern[]").filter(Boolean) as string[];
        const telefonnummerTypen = formData.getAll("telefonnummer_typen[]").filter(Boolean) as string[];
        const titelIds = formData.getAll("titel_id[]").filter(Boolean) as string[];

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

            return Response.json({success: "Person erfolgreich erstellt."});
        } else if (action === "update") {

            return Response.json({success: "Person erfolgreich aktualisiert."});
        } else if (action === "delete") {
            const personId = parseInt(formData.get("person_id") as string, 10);

            const personEmails = await prisma.person_hat_email.findMany({
                where: {person_id: personId},
                select: {email_id: true},
            });

            const personTelefonnummern = await prisma.person_hat_telefonnummer.findMany({
                where: {person_id: personId},
                select: {telefonnummer_id: true},
            });

            await prisma.person_hat_email.deleteMany({
                where: {person_id: personId},
            });
            await prisma.person_hat_telefonnummer.deleteMany({
                where: {person_id: personId},
            });

            await prisma.person.delete({
                where: {person_id: personId},
            });

            // Für jede E-Mail prüfen, ob noch andere Personen sie referenzieren.
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

            // Für jede Telefonnummer prüfen, ob noch andere Personen sie referenzieren.
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

            return Response.json({success: "Person und zugehörige Daten erfolgreich gelöscht."});
        }

        return null;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            // check for unique constraint
            const target = ((error.meta && error.meta.target) || []) as string[];
            let message = "Ein oder mehrere Felder sind bereits vergeben.";
            if (target.includes("mitgliedsnummer")) {
                message = "Die Mitgliedsnummer existiert bereits. Bitte wähle eine andere.";
            } else if (target.includes("schuetzenpassnummer")) {
                message = "Die Schützenpassnummer existiert bereits. Bitte wähle eine andere.";
            }
            return Response.json({error: message}, {status: 400});
        }
        if (error instanceof Error) {
            return Response.json({error: error.message}, {status: 400});
        }
        return Response.json({error: "Unbekannter Fehler"}, {status: 400});
    }
}
